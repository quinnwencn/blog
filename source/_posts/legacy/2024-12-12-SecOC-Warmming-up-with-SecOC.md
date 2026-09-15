---
title: "[SecOC] Warmming up with SecOC"
date: 2024-12-12 00:00:00
tags:
  - "Crypto"
  - "Automotive"
  - "SecOC"
categories:
  - "Systems C++"
---

# What is SecOC and Why we need it
Protecting sensitive data during communication is crucial. A malformed message can corrupt or disrupt the system. In traditional communication setups, Ethernet is widely used to carry data, and methods like Transport Layer Security (TLS) or signatures ensure authentication and integrity. However, in the automotive industry, communication between ECUs (Electronic Control Units) typically uses CAN (Controller Area Network) or CAN FD (Flexible Data-rate), which have much smaller frame sizes than Ethernet, making them unsuitable for large data transfers.

This is where SecOC (Secure Onboard Communication) comes into play. SecOC addresses this limitation by providing mechanisms for authenticity and integrity protection, using either asymmetric or symmetric methods. MAC (Message Authentication Code) is commonly used for symmetric authentication, while signatures are used for asymmetric authentication. SecOC supports both methods. But how does it work?

# How SecOC implements authenticity and integrity protection
## Symmetric Method
### Overview
To verify the authenticity and freshness of messages between ECUs in a vehicle, SecOC defines several components that both the sending and receiving ECUs must use:
* Symmetric key
* Freshness value (counter or timestamp)
* MAC algorithm

On the sender's side, the SecOC module uses the data along with the components above to calculate a MAC and sends both the data and the calculated MAC. The freshness value is optional. On the receiver's side, the SecOC module verifies the freshness and authenticity of the received message by recalculating the MAC using the same components. The receiving ECU must know the freshness value used by the sender.

![image](https://github.com/user-attachments/assets/97b41a15-cfd4-4ea5-8ae8-6f545552eae4)

In the diagram above, the data being sent is called a PDU (Protocol Data Unit), and a counter (CNT) is used as the freshness value. If the freshness value is not included in the message, there must be another way for the receiving ECU to retrieve it.

### Definition of the PDU
The payload of a Secured I-PDU consists of the Authentic I-PDU, which is the data to be sent by the sender, and an Authenticator (MAC). As stated above, the Freshness Value is optionally included in the payload of a Secured I-PDU. The order of which the contents are structured in a Secured I-PDU is shown below:
![image](https://github.com/user-attachments/assets/61ac9b6b-eaf1-4fdd-afa7-70d8fa2f7a42)

> Note:
> The length of the Authentic I-PDU, the Freshness Value and the Authenticator within a Secured I-PDU may vary from on one uniquely indefinable Secured I-PDU to another.

The Authenticator is calculated using the Key, Data Identifier of the Secured I-PDU, Authentic Payload, and the Freshness Value. So any of them changed will lead to a different Authenticator, which provides a high level of confidence. Since the max length of a CAN message is limited(8 for CAN and 64 for CAN FD), the Authenticator usually need to truncated. According to AUTOSAR, if truncation is possible, the Authenticator should only be truncated down to the most significant bits of the resulting Authenticator generator using above method. And the Freshness Value should be truncated Up to the least significant bits, As shown below:
![image](https://github.com/user-attachments/assets/a43fd9c8-336c-462f-b8e9-d1102cca8901)

It’s important to note that truncating the MAC reduces the security level, making it easier for hackers to launch guessing attacks. Therefore, AUTOSAR recommends using a key length of at least 16 bytes. The freshness counter should be incremented by the Freshness Manager before the authentication data is provided to the receiving ECU.

### Rules of Freshness and MAC Truncation
The exact rules for MAC and freshness truncation depend on the specific security protocol and system requirements. The goal is to balance security and performance by limiting the data that needs to be authenticated or encrypted while still protecting against attacks.

The truncated length (Tlen) of the MAC is an important security parameter. It plays a crucial role in defending against guessing attacks. [NIST Special Publication 800-38B outlines how this parameter should be managed.](https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-38b.pdf). 

The verification process confirms whether the MAC on a message is valid. If the output is INVALID, the message is definitely not authentic, meaning it didn’t originate from the expected source.

If the output is VALID, the mode assures that the message is authentic and wasn’t altered during transmission. However, this assurance is not absolute. In theory, an attacker without access to the key or MAC generation process could guess the correct MAC. The likelihood of success is 1 in 2^Tlen. Therefore, using a larger Tlen reduces the chance of an attacker guessing the correct MAC.

It’s crucial to limit the number of invalid verification attempts for each key to mitigate such attacks.

### Message Span of the Key 

The message span of a key refers to the number of messages for which MACs are generated using the key.  The security of the system depends on the key's message span. An attacker may attempt to find a collision—two distinct messages with the same MAC—before truncation.

The probability of such collisions increases with the message span. Collisions are expected after generating  $2^ {b/2}$ messages, where b is the block size of the underlying cipher. For AES, this means collisions may occur after $2^ {64}$ messages. To avoid this risk, it's important to limit the message span of any given key.

#### Security Recommendations
To limit the risk of collisions and maintain high security, it's recommended to limit the message span of any CMAC key. For general applications, the maximum message span should be limited to $2^ {48}$ messages for a 128-bit block cipher like AES, ensuring that the probability of collision remains minimal.

For high-security applications, the key's message span can be measured in message blocks, with a recommended limit of $2^ {48}$ message blocks. By adhering to these guidelines, the risk of collisions can be kept to an acceptable level, with a probability of less than 1 in a billion for AES and 1 in a million for TDEA.

>Ref:
>[1] FIPS Publication 197, The Advanced Encryption Standard (AES), U.S. DoC/NIST, November 26, 2001.
[>2] FIPS Publication 198, The Keyed-Hash Message Authentication Code, U.S. DoC/NIST, March 6, 2002.
[>3] T. Iwata, K. Kurosawa, OMAC: One-Key CBC MAC, in Fast Software Encryption, 10th International Workshop, FSE 2003, Lecture Notes in Computer Science, Vol. 2887, Thomas Johansson, ed., Springer-Verlag (2003), p.p. 129–153.

### Selection of the MAC Length

Larger values of Tlen (the length of the MAC) provide stronger protection against guessing attacks. However, this increased security comes at the cost of performance. Specifically, larger Tlen values require more bandwidth and storage for transmitting and storing the MAC.

To guide this trade-off, NIST (National Institute of Standards and Technology) provides two key parameters that help define the acceptable balance between security and performance:

1. Risk – The maximum allowable probability that an inauthentic message will be accepted by the system (i.e., a false positive).
2. MaxInvalids – The maximum number of times the system will tolerate the error message "INVALID" before the cryptographic key is retired, across all instances of the MAC verification process.

Given these parameters, the required value of Tlen can be calculated using the following formula:

$$Tlen = \log_2 \left( \frac{\text{MaxInvalids}}{\text{Risk}} \right)$$

For example,  the MAC verification process will not output "INVALID" more than 1024 times before the key is retired.  This means *MaxInvalids = 1024*, or in binary, $2^{10}$. Additionally, the system can tolerate a one-in-a-million chance of accepting an inauthentic message, which gives us *Risk = $2^{-20}*.
Using these values in the formula:

$$Tlen = \log_2 \left( \frac{2^{10}}{2^{-20}} \right) = 30$$

Once the number of INVALID messages exceeds a predefined threshold, the key used for SecOC should be regenerated and replaced with a new one.

AUTOSAR also have some recommendation for the MAC truncation and Freshness Value truncation:
#### SecOC Profile 1 (or 24Bit-CMAC-8Bit-FV) Recommended
[PRS_SecOc_00610] Using the CMAC algorithm based on AES-128 according to NIST SP 800-38B to calculate the MAC, use the eight least significant bit of the freshness value as truncated freshness value and use the 24 most significant bits of the MAC as truncated MAC.
![image](https://github.com/user-attachments/assets/3c247cb2-868a-4c22-a2fc-fc18e38141f5)

#### SecOC Profile 3 (or JASPAR) Recommended
[PRS_SecOc_00630] This profile depicts one configuration and usage of the [JasPar counter](https://rosenstatter.net/thomas/files/prdc2019ExtendingAUTOSAR.pdf) base FV with the Master-Slave Synchronization method. It uses the CMAC algorithm based on AES-128 according to NIST SP 800-38B Appendix-A to calculate the MAC. Use the 4 least significant bits of the freshness value as truncated freshness value and use the 28 most significant bits of the MAC as truncated MAC. Freshness Value provided to SecOC shall be constructed as described in the [UC_SecOC_00202]. The profile shall be used for CAN.
![image](https://github.com/user-attachments/assets/f652f2d3-76ac-446b-afb4-ad4fcf826a42)

## Key Management

TODO

[source issue](https://github.com/quinnwencn/blog/issues/83)
