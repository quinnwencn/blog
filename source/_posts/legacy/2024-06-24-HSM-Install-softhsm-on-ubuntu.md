---
title: "[HSM] Install softhsm on ubuntu"
date: 2024-06-24 00:00:00
tags:
  - "HSM"
categories:
  - "Security Crypto"
---

1. Download source code from [softHSM release page](https://github.com/opendnssec/SoftHSMv2/tags)
```bash
wget https://github.com/opendnssec/SoftHSMv2/archive/refs/tags/2.6.1.tar.gz

tar -xvf 2.6.1.tar.gz
```
2.  Compile the source code
```bash
cd SoftHSMv2-2.6.1
./autogen.sh
./configure --prefix=/opt/softhsm
make -j4
sudo make install
```
3. Add softhsm binary to PATH
```bash
vim ~/.bashrc
# add following line to ~/.bashrc
export PATH=$PATH:/opt/softhsm/bin
```
4. Now softhsm2-util is available on your machine:
![image](https://github.com/user-attachments/assets/eb58e711-ce81-4312-b64b-b5c5589ad30c)
5. Install opensc 
```bash
sudo apt install opensc
```

[source issue](https://github.com/quinnwencn/blog/issues/47)
