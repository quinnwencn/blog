---
title: "[ECU] Keys and Certificates Management"
date: 2024-11-27 00:00:00
tags:
  - "Automotive"
categories:
  - "Security Crypto"
---

# 密钥证书管理分类
s32g399是一款多核异构的汽车处理芯片，A核运行Linux系统，M核则负责与底层ECU进行通信。基于S32g399的ECU，在运行中，需要与云端建立TLS双向认证链路，在诊断时需要与诊断仪进行UDS29双向认证，同时M核需要与其他ECU进行SECOC认证通信。因此，需要在生产时，提前对ECU进行密钥证书灌装。对于该ECU而言，涉及到的密钥和证书如下表所示：

| 证书/密钥名称 | 算法 | 用途 | 存储核心 | 存储介质 | 秘钥管理 | 备注 |
|----|----|----|----|----|----|----|
| A核安全启动密钥 | RSA3072/RSA2048/secp256r1 | 校验A核固件安全启动 | A核 | 公钥存储在eFUSE私钥存储在SignServer | 同车型使用一个密钥 |    |
| M核安全启动密钥 | AES-128 for CMAC based secure bootRSA 3072/RSA 2048 for Asymmetric algoritym based secure boot | 校验M核固件安全启动 | M核 | 公钥存储在eFUSE私钥存储在SignServer | 同车型使用一个密钥 |    |
| 设备证书/OTA证书 | secp256r1 | 用于和后端建立TLS双向认证链路 | A核 | HSE | 一车一密 |    |
| 设备私钥（包含公私钥） | secp256r1 | 与设备证书/OTA证书配套，用于和后端建立TLS双向认证链路 | A核 | HSE | 一车一密 |    |
| UDS29服务证书 | secp256r1 | 用于与诊断仪UDS29服务认证 | M核 | HSE/secure FLASH | 一车一密 |    |
| UDS29 私钥 | secp256r1 | UDS29服务证书配套，用于与诊断仪UDS29服务认证 | M核 | HSE/secure FLASH | 一车一密 |    |
| SECOC 密钥 | AES-128 | 用于整车 | M核 | HSE/secure FLASH | 一车一密 |    |


# 证书密钥生命周期管理
密钥的全生命周期包括了密钥的生产、存储、分发、使用、更新以及撤销环节。

## 生成

* A核安全启动密钥：由SignSever生成，编译期间由SignServer对VDU A核固件进行签名，签名后的固件在ECU上启动验证；
* M核安全启动密钥：无论是CMAC的安全启动还是非对称算法的安全启动方案，密钥均由SignServer生成；
* 设备证书/OTA证书：由ECU生成私钥后，基于私钥生成CSR，经由灌装工具发送给SignServer签名生成，最后灌装到ECU上；
* 设备私钥（包含公私钥）： 在灌装流程中，由灌装工具触发ECU生成，生成后用于生成设备证书；
* UDS29服务证书： 生成方式同设备证书/OTA证书
* UDS29 私钥： 生成方式同设备私钥（包含公私钥）
* SECOC密钥：由KMS生成，与车辆VIN绑定，一车一密

## 存储

存储要求见上表

## 分发/灌装

* A核安全启动密钥：由eFUSE的blow流程管理覆盖
* M核安全启动密钥：如果使用CMAC 的secure boot方案，在启用secure boot时，写入BOOT_MAC_KEY区域（或者HSE，根据芯片实现而定），如果使用Asymmetric algorithm实现的secure boot，则需要在eFUSE中提前写入对应secure boot公钥，并锁死EFUSE的写入。


* 设备/OTA密钥证书与UDS29服务密钥证书：由灌装工具触发生成私钥后，灌装工具获取CSR后，由SignServer签发证书后灌装到ECU，详细实现可基于UDS增加routine实现，关键步骤实现如下图所示：


```bash
  +-------------------+           +-------------------+          +-------------------+
  |    SignServer     |           |   Diagnostic Tool |          |       ECU         |
  +-------------------+           +-------------------+          +-------------------+
           |                            |                              |
           |                            | (1) Send key generation      |
           |                            |     command to ECU           |
           |                            |----------------------------->|
           |                            |                              |
           |                            | (2) Generate key pair        |
           |                            |     (private/public keys)    |
           |                            |                              |
           |                            | (3) Generate CSR             |
           |                            |     (based on public key)    |
           |                            |----------------------------->|
           |                            |                              |
           |                            | (4) Return CSR to Diagnostic |
           |                            |     Tool                     |
           |                            |<-----------------------------|
           |                            |                              |
           |                            |                              |
           |                            |                              |
           |                            |                              |
           |                            |                              |
           |                            |                              |
           |                            |                              |
           | (5) Initiate TLS connection|                              |
           |     to SignServer          |                              |
           |<---------------------------|                              |
           |                            |                              |
           |                            |                              |
           | (6) Request to sign CSR    |                              |
           |     from SignServer        |                              |
           |<---------------------------|                              |
           |                            |                              |
           |                            |                              |
           | (7) SignServer signs the   |                              |
           |     CSR and issues certifi-|                              |
           |     ticate                 |                              |
           |<---------------------------|                              |                
           |                            |                              |
           | (8) Return signed cert to  |                              |
           |     Diagnostic Tool        |                              |
           |--------------------------->|                              |
           |                            |                              |
           |                            |                              |
           |                            | (9) Install certificate chain|
           |                            |     into ECU                 |
           |                            |----------------------------->|
           |                            |                              |
           +----------------------------+----------------------------+
```

* SECOC key：由KMS生成，通过灌装工具灌装到整车，一车一密。SECOC密钥灌装有两种方案：
1. 灌装工具灌装到VDU的M核后，由M核发起对其他SECOC参与ECU的密钥灌装，所有ECU灌装完成后，由VDU的M核对诊断工具发起肯定响应，灌装失败则发送否定响应；
2. 灌装工具单独对每个SECOC参与ECU进行灌装
对不同的SECOC域采用相同的灌装方式，两种方案都满足要求，可根据需要选取。

## 使用

密钥的使用过程中，应确保密钥不出HSM/HSE

## 更新

* secure boot相关密钥无法更新
* 设备/OTA密钥证书与UDS29服务密钥证书：如发生泄露或者过期前更新，更新方式支持线下诊断工具更新；自动更新机制暂不支持
* SECOC密钥：由SECOC策略管理

## 撤销
设备/OTA密钥证书与UDS29服务密钥证书在更新及撤销时，如果具备OCSP(Online Certificate Status Protocol)支持，应按照OCSP更新证书状态，其他密钥在撤销后，应不再使用并删除该密钥。

# Certificate Authority

为了满足不同的证书之间分层管理，应至少部署两个CA，分别用于签发ECU设备证书和诊断UDS29相关证书，如下图所示：

```bash
                 +---------------------+
                 |       Root CA       |
                 |  (Root Certificate) |
                 +---------------------+
                          |
           +--------------+--------------+
           |                             |
     +----------------+           +----------------+
     |   ECU CA       |           | Diagnostic     |
     |  (Intermediate)|           |     CA         |
     +----------------+           | (Intermediate) |
           |                      +----------------+
           |                            |
           |                            |
    +--------------+            +--------------------+
    |  ECU Device  |            |                    |
    | (End-Entity) |            |                    |
    +--------------+   +-----------------+     +------------------+   
                       | Diagnostic Tool |     |   ECU UDS 29     |
                       | (End-Entity)    |     |  (End-Entity)    |
                       +-----------------+     +------------------+           
```

证书为了和车辆绑定，建议CN采用车辆VIN码或者是VIN码衍生的VID，同时加以ECU名称构成，例如：`VDU-VID`格式或者`VDU-VIN`，此项仅作为推荐项。

> **info**: 如果为了方便管理，可以将ECU设备证书和UDS 29认证证书合并，ECU中只存在一个证书，该套证书密钥同时用于OTA、TLS等安全链路的建立，同时用于UDS 29认证，但因违背了证书密钥用途单一原则，相应的也降低了安全性。

[source issue](https://github.com/quinnwencn/blog/issues/77)
