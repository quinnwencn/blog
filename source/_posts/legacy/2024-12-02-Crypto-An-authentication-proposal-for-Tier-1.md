---
title: "[Crypto] An authentication proposal for Tier 1"
date: 2024-12-02 00:00:00
tags:
  - "Crypto"
categories:
  - "Security Crypto"
---

In vendor management, an OEM (Original Equipment Manufacturer) may require their vendors to provide a secure authentication method for the ECUs (Electronic Control Units) they supply, particularly in the context of self-driving vehicles. Components like lidar sensors and cameras must be protected from malware and tampering, and they should have mechanisms in place to prove that they have not been compromised.

One effective way to achieve this is by implementing cryptographic protection. Vendors can request the OEM to sign an Immediate CA (Certification Authority) certificate for themselves. Using this Immediate CA, vendors can then issue certificates for each ECU they manufacture for the OEM. If multiple OEMs are using the same ECU, the vendor can issue certificates signed by different Immediate CAs, each associated with the respective OEM.

With the certificates issued by the Immediate CA, the ECUs can perform asymmetric authentication with the vehicle.
![image](https://github.com/user-attachments/assets/3672cd9e-d9f2-4969-bc75-ce8594a11c65)

Since both the vendor-supplied ECUs and those manufactured by the OEM are signed by the same root CA, they can verify each other during boot-up or at any other time. For added security, the ECUs can derive symmetric keys to enable secure communication.

> Note: For ECUs that do not support asymmetric cryptography algorithms, vendors should provide a method for the OEM to provision symmetric keys during the vehicle's manufacturing process.

[source issue](https://github.com/quinnwencn/blog/issues/80)
