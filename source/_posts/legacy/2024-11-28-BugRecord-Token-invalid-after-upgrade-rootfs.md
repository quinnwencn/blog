---
title: "[BugRecord] Token invalid after upgrade rootfs"
date: 2024-11-28 00:00:00
tags:
  - "TrustZone"
  - "TEE"
  - "Layerscape"
  - "Rootfs"
  - "BSP"
categories:
  - "Embedded Linux"
---

# Problem Summary
I enabled virtual-based HSM in Layerscape(ls1043ardb) with TEE. The system worked well initially, but after upgrading, I found that I could no longer use the previously generated keys in the HSM to verify certificates on my machine.

## Related commands:
1. **Initialize a token in HSM**:
```bash
p11tool --initialize "pkcs11:model=PKCS11-OP-TEE;manufacturer=NXP;serial=1;token=greengrass;id=%00%00%00%00;object=tcu_key;type=private" --provider /usr/lib/libpkcs11.so --label greengrass
```
2. **Generate key pairs using openssl** (Note: it's recommended to generate key pairs in HSM, but this is for demonstration):
```bash
openssl genrsa -out rsa_key_2048.pem 2048
```
3. **Import private key into HSM using `sobj_app`, provided by NXP**:
```bash
sobj_app -C -f rsa_key_2048.pem -k rsa -o pair -s 2048 -l "tcu_key" -i 0
```
After the key is imported, I use a custom tool to generate a root CA using the imported key in HSM， issue a certificate, and pass it to another device. The solution worked well for me before the upgrade. However, after upgrading the system, I can no longer use the key in HSM to verify the certificate I issued.

# Solution Investigation
The first issue I suspected was that TEE might be encrypting the meta files on REE, located at `/data/tee`. My assumption was that these files might have been corrupted during the upgrade. However, after checking,  I found that the files and db in `/data/tee` remained unchanged after the upgrade:
* Hashes of files in `/data/tee` before upgrade:
![image](https://github.com/user-attachments/assets/39bc8c66-37c1-4287-ac05-2768aadf7004)
* Hashes of files in `/data/tee` after upgrade:
![image](https://github.com/user-attachments/assets/1599a2a2-4030-41ba-a7fb-6dc6484a7014)
So, file corruption was not the cause of the problem. However, the fact that the files were not corrupted doesn't necessarily mean that the TEE applicationITA) can still open and read them properly.
Since files in REE are encrypted. it's possible that TEE lost the key to decrypt these encrypted files, causing the HSM to lose the keys. Upon further inspection, I found that the **FEK** is Encrypted using **TSK**(Trust Application Storage Key), and the **TSK** is generated using the *HMAC-SHA256* algorithm with parameters derived from **SSK**(Secure Storage Key) and **TA_UUID**. **SSK** is also generated using *HMAC-SHA256*, but with parameters from **HUK**(Hardware Unique Key) and Chip ID, both of which are unique per chip. The **HUK** is read from either **CAAM**(Cryptographic Accelerator and Assurance Module) or the **OTP**(One-Time Programmable) device. Because the SSK, TSK, and FEK are chip-specific and are supposed to remain the same after an upgrade, I concluded that these cannot be the cause of the HSM failure.  Further details about SSK, TSK, and FEK can be found in my original blog: [TEE的机密性和完整性保障](https://github.com/quinnwencn/blog/issues/4).
Next, I compared the token in the HSM before and after the upgrade, which finally revealed the root cause:
* Token before upgrade:
![image](https://github.com/user-attachments/assets/7dc7f06d-64f6-4522-8e5f-51ca027f55cd)
* Token after upgrade:
![image](https://github.com/user-attachments/assets/a2f8df6e-b65d-4d5e-8a0c-b4559fed676d)
The token label changed from `greengrass` to `TEE_BASED_TOKEN` after the upgrade. The latter label(`TEE_BASED_TOKEN` is the default label used by NXP for an uninitialized token:
```C
CK_RV C_GetTokenInfo(CK_SLOT_ID slotID, CK_TOKEN_INFO_PTR pInfo)
{
	CK_RV rc = CKR_OK;
	struct slot_info *slot_info = NULL;

	p11_global_lock();

	if (!is_lib_initialized()) {
		rc = CKR_CRYPTOKI_NOT_INITIALIZED;
		goto end;
	}

	if (pInfo == NULL) {
		rc = CKR_ARGUMENTS_BAD;
		goto end;
	}

	switch (slotID) {
		case TEE_SLOT_ID:
			if (token_already_initialized(slotID)) {
				slot_info = get_global_slot_info(TEE_SLOT_ID);
				memcpy(pInfo, &slot_info->token_data.token_info,
					sizeof(CK_TOKEN_INFO));
			} else
				Get_TEE_TokenInfo(pInfo);
			break;
		default:
			rc = CKR_SLOT_ID_INVALID;
	}

end:
	p11_global_unlock();
	return rc;
}
```
In `C_GetTokenInfo`, if the token is uninitialized, it calls `Get_TEE_TokenInfo`, which assigns the default "uninitialized" state to the token. This is problematic because if a token is uninitialized, it should either return an empty token or a message indicating that the token is uninitialized, similar to how SoftHSM handles it.
```C
CK_RV Get_TEE_TokenInfo(CK_TOKEN_INFO_PTR pInfo)
{
	memset(pInfo->label, ' ', sizeof(pInfo->label));
	strncpy((char *)pInfo->label, "TEE_BASED_TOKEN",
		strlen("TEE_BASED_TOKEN"));

	memset(pInfo->manufacturerID, ' ', sizeof(pInfo->manufacturerID));
	strncpy((char *)pInfo->manufacturerID, "NXP", strlen("NXP"));

	memset(pInfo->model, ' ', sizeof(pInfo->model));
	strncpy((char *)pInfo->model, "PKCS11-OP-TEE",
		strlen("PKCS11-OP-TEE"));

	memset(pInfo->serialNumber, ' ', sizeof(pInfo->serialNumber));
	strncpy((char *)pInfo->serialNumber, "1", strlen("1"));

	pInfo->flags = 0;
	pInfo->ulMaxSessionCount = 10;
	pInfo->ulSessionCount = 0;
	pInfo->ulMaxRwSessionCount = 5;
	pInfo->ulRwSessionCount = 0;
	pInfo->ulMaxPinLen = 8;
	pInfo->ulMinPinLen = 4;
	pInfo->ulTotalPublicMemory = CK_UNAVAILABLE_INFORMATION;
	pInfo->ulFreePublicMemory = CK_UNAVAILABLE_INFORMATION;
	pInfo->ulTotalPrivateMemory = CK_UNAVAILABLE_INFORMATION;
	pInfo->ulFreePrivateMemory = CK_UNAVAILABLE_INFORMATION;
	pInfo->hardwareVersion.major = 0;
	pInfo->hardwareVersion.minor = 0;
	pInfo->firmwareVersion.major = 0;
	pInfo->firmwareVersion.minor = 0;
	memset(pInfo->utcTime, '0', sizeof(pInfo->utcTime));

	return CKR_OK;
}
```
From the code above, it's clear that the token status changes from "initialized" to "uninitialized" after an upgrade. However, the question remains: Where is the token status stored, and why does it change after the upgrade?

To investigate, I looked into the function token_already_initialized. Token information is queried using get_global_slot_info, which retrieves the token by slot ID from a global variable g_slot_info. In the same file (general.c), get_global_slot_info is called in initialize_slot, which then reads slot information from data using token_load_data. This eventually calls token_load_data_file, which reads the token file from /lib/optee_armtz/%s%lu.

The root cause is that the token data is stored in /lib/optee_armtz/%s%lu, which resides in the root filesystem. When the system is upgraded, the root filesystem is overwritten, causing the token information to be deleted.
```C
static uint32_t token_load_data_file(CK_SLOT_ID slotID,
			struct token_data *token_data)
{
	FILE *fptr = NULL;
	uint32_t rc = 0;
	char file_name[50];
	struct token_data td;

	sprintf(file_name, "/lib/optee_armtz/%s%lu",  "TEE_TOKEN_", slotID);

	fptr = fopen(file_name, "r");
	if (!fptr) {
		print_info("fopen failed\n");
		rc = errno;
		goto end;
	}

	/* Read token data */
	if (!fread(&td, sizeof(struct token_data), 1, fptr)) {
		print_info("fread failed\n");
		rc = errno;
		goto end;
	}

	memcpy(token_data, &td, sizeof(struct token_data));
	fclose(fptr);
end:
	return rc;
}
```

# Conclusion
NXP stores token info in `/lib/optee_armtz/%s%u`, which resides in the root filesystem. When the root filesystem is upgraded, the token info is deleted.

[source issue](https://github.com/quinnwencn/blog/issues/79)
