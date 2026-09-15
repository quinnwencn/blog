---
title: "01 Build BSP for S32G274AEVB"
date: 2024-04-26 00:00:00
tags:
  - "S32G"
  - "Yocto"
categories:
  - "Security Crypto"
---

<p>NXP为S32GAEVB提供了基于Yocto的BSP工程，基本编译步骤如下：
</p>
<li>安装repo工具
</li>
<p>``<code>
</p>
<p>mkdir -p ~/bin
</p>
<p>curl http://commondatastorage.googleapis.com/git-repo-downloads/repo  > ~/bin/repo
</p>
<p>chmod +x ~/bin/repo
</p>
</code>`<code>
<li>拉取S32G274AEVB yocto代码
</li>
</code>`<code>
<p>mkdir fsl-auto-yocto-bsp && cd  fsl-auto-yocto-bsp
</p>
<p>repo init -u https://github.com/nxp-auto-linux/auto_yocto_bsp.git -b release/bsp36.0
</p>
<p>repo sync -j$(nproc)
</p>
</code>`<code>
<li>编译yocto
</li>
</code>`<code>
<p>./sources/meta-alb/scripts/host-prepare.sh
</p>
<p>source nxp-setup-alb.sh -m s32g274aevb
</p>
<p>bitbake fsl-image-base
</p>
</code>`<code>
<p>编译前会拉取uboot、linux等的代码仓库，如果遇到failed to fetch问题，可以通过重新安装</code>ca-certificates<code>解决。
</p>
<img src="https://github.com/robertwenhk/blog/assets/143626366/36b161f7-7f4a-47f1-8a52-e64db271d209" alt="image" style="max-width:100%;">
<p>Solved by </code>sudo apt-get install --reinstall ca-certificates<code>
</p>
<p>如果有下载进度，最后还是相同的错误，可以多尝试几次。
</p>
<li>编译产物
</li>
<p>bitbake编译成功后，产物在</code>tmp/deploy/images/s32g274aevb`
</p>
<img src="https://github.com/robertwenhk/blog/assets/143626366/7b369979-ed5d-49c5-bbea-de50d9ce012d" alt="image" style="max-width:100%;">
