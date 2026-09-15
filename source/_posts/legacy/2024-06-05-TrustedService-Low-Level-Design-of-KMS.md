---
title: "[TrustedService] Low Level Design of KMS"
date: 2024-06-05 00:00:00
tags:
  - "KMS"
  - "Low Level"
categories:
  - "Security Crypto"
---

High Level可以參考[High Level Design of KMS](https://github.com/robertwenhk/blog/issues/36)，這裏負責將KMS的Low Level設計。

# 1.組建設計細化
## 1.1 API 
KMS需要提供密鑰生成、密鑰查詢、密鑰更新、密鑰刪除、數據加密和數據揭秘功能，每個功能應單獨設立一個API
* 密鑰生成：POST /keys
* 密鑰查詢：GET /keys/query
* 密鑰更新：POST /keys/update
* 密鑰刪除：DELETE /keys/delete
* 數據加密：POST /encrypt
* 數據解密：POST /decrypt
## 1.2 API請求與響應
### 1.1 密鑰生成
* 請求：POST /keys
```json
{
    "keyType": "AES/RSA/ECC",
    "keySize": "128/1026/prime256v1",
}
```
* 響應：
```json
{
    "keyId": "cb7a45c7-147d-4f9a-a283-2c40dd0d0837",
    "publicKey": "(optional)",
}
```
### 1.2 密鑰查詢
* 請求：GET /keys/query
```json
{
    "keyId": "cb7a45c7-147d-4f9a-a283-2c40dd0d0837"
}
```
* 響應
```json
{
   "exist": true 
}
```
### 1.3 密鑰更新 POST /keys/update
* 請求
```json
{
    "keyId": "cb7a45c7-147d-4f9a-a283-2c40dd0d0837"
}
```
* 響應
```json
{
    "status": 1 (success), 0(failed)
}
```
### 1.4 密鑰刪除 DELETE /keys/delete
* 請求
```json
{
    "keyId": "cb7a45c7-147d-4f9a-a283-2c40dd0d0837"
}
```
* 響應
```json
{
    "status": 1 (success), 0(failed)
}
```
### 1.5 數據加密 POST /encrypt
* 請求
```json
{
    "keyId": "cb7a45c7-147d-4f9a-a283-2c40dd0d0837",
    "plainText": "fsagdsagdgdgggd",
}
```
* 響應
```json
{
    "status": 1 (success), 0(failed),
    "cipherText": "gfsagdgsd"
}
```
### 1.6 數據解密 POST /decrypt
* 請求
```json
{
    "keyId": "cb7a45c7-147d-4f9a-a283-2c40dd0d0837",
    "cipherText": "fsagdsagdgdgggd",
}
```
* 響應
```json
{
    "status": 1 (success), 0(failed),
    "plainText": "gfsagdgsd"
}
```
## 1.2 身份驗證和授權

[source issue](https://github.com/quinnwencn/blog/issues/37)
