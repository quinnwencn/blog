---
title: "[BugRecord] S32g274 repo sync failed"
date: 2024-11-27 00:00:00
tags:
  - "S32G"
  - "BSP"
categories:
  - "Systems C++"
---

# Problem Summary
Build the Linux BSP following `S32G2_LinuxBSP_32.0_User_Manual.pdf`:
1. Install repo
```bash
mkdir ~/bin
curl http://commondatastorage.googleapis.com/git-repo-downloads/repo > ~/bin/repo
chmod a+x ~/bin/repo
PATH=${PATH}:~/bin
```
2. Configure the git environment (Which is already done on my machine)
```bash
git config --global user.email "you@example.com"
git config --global user.name "Your Name"
```
3. Download the Yocto project environment into my working directory
```bash
mkdir -p s32g-bsp32.0
cd  s32g-bsp32.0
repo init  -u https://source.codeaurora.org/external/autobsps32/auto_yocto_bsp -b release/bsp32.0
repo sync
```
Step 3 won't work since the code has been moved from Codeaurora to GitHub, So we need to change a little bit to make it work:
```bash
repo init -u https://github.com/nxp-auto-linux/auto_yocto_bsp -b release/bsp32.0
repo sync
```
But this still won't work since some meta repo still using the original links of Codeaurora.
> Automotive Linux BSP (ALB) has been published on CodeAurora Forum (CAF) until BSP 34.0. Starting with BSP 34.0.1, the Automotive Linux BSP releases are published on GitHub. All releases published on CAF have been migrated to GitHub (without changing the Yocto files pointing to CAF links). In order to be able to build Auto Linux BSPs initially published on CAF, a Bash script has been implemented that is able to update the repo manifests and Yocto files, by adapting the CAF git repository links to corresponding NXP GitHub repository links. By using this script, Yocto builds can be performed without the need to pull sources from CAF.
>
>> [Codeaurora_migration](https://github.com/nxp-auto-linux/linux-bsp-utils/tree/master/codeaurora_migration)

Download the script in  [Codeaurora_migration](https://github.com/nxp-auto-linux/linux-bsp-utils/tree/master/codeaurora_migration) and follow the command resolve my problem:
```bash
./migrate.sh --full --work_path ./testfolder --release_branch release/bsp32.0
```

[source issue](https://github.com/quinnwencn/blog/issues/78)
