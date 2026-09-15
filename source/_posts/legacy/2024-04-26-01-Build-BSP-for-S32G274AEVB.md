---
title: "01 Build BSP for S32G274AEVB"
date: 2024-04-26 00:00:00
tags:
  - "S32G"
  - "Yocto"
categories:
  - "Security Crypto"
---

NXP为S32GAEVB提供了基于Yocto的BSP工程，基本编译步骤如下：
1. 安装repo工具
```
mkdir -p ~/bin
curl http://commondatastorage.googleapis.com/git-repo-downloads/repo  > ~/bin/repo
chmod +x ~/bin/repo
```
2. 拉取S32G274AEVB yocto代码
```
mkdir fsl-auto-yocto-bsp && cd  fsl-auto-yocto-bsp
repo init -u https://github.com/nxp-auto-linux/auto_yocto_bsp.git -b release/bsp36.0
repo sync -j$(nproc)
```
3. 编译yocto
```
./sources/meta-alb/scripts/host-prepare.sh
source nxp-setup-alb.sh -m s32g274aevb
bitbake fsl-image-base
```
编译前会拉取uboot、linux等的代码仓库，如果遇到failed to fetch问题，可以通过重新安装`ca-certificates`解决。
![image](https://github.com/robertwenhk/blog/assets/143626366/36b161f7-7f4a-47f1-8a52-e64db271d209)

Solved by `sudo apt-get install --reinstall ca-certificates`
如果有下载进度，最后还是相同的错误，可以多尝试几次。
4. 编译产物
bitbake编译成功后，产物在`tmp/deploy/images/s32g274aevb`
![image](https://github.com/robertwenhk/blog/assets/143626366/7b369979-ed5d-49c5-bbea-de50d9ce012d)

[source issue](https://github.com/quinnwencn/blog/issues/28)
