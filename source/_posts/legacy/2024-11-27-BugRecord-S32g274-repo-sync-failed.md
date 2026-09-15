---
title: "[BugRecord] S32g274 repo sync failed"
date: 2024-11-27 00:00:00
tags:
  - "S32G"
  - "BSP"
categories:
  - "Systems C++"
---

<h1>Problem Summary
</h1>
<p>Build the Linux BSP following <code>S32G2_LinuxBSP_32.0_User_Manual.pdf</code>:
</p>
<li>Install repo
</li>
<p>``<code>bash
</p>
<p>mkdir ~/bin
</p>
<p>curl http://commondatastorage.googleapis.com/git-repo-downloads/repo > ~/bin/repo
</p>
<p>chmod a+x ~/bin/repo
</p>
<p>PATH=${PATH}:~/bin
</p>
</code>`<code>
<li>Configure the git environment (Which is already done on my machine)
</li>
</code>`<code>bash
<p>git config --global user.email "you@example.com"
</p>
<p>git config --global user.name "Your Name"
</p>
</code>`<code>
<li>Download the Yocto project environment into my working directory
</li>
</code>`<code>bash
<p>mkdir -p s32g-bsp32.0
</p>
<p>cd  s32g-bsp32.0
</p>
<p>repo init  -u https://source.codeaurora.org/external/autobsps32/auto_yocto_bsp -b release/bsp32.0
</p>
<p>repo sync
</p>
</code>`<code>
<p>Step 3 won't work since the code has been moved from Codeaurora to GitHub, So we need to change a little bit to make it work:
</p>
</code>`<code>bash
<p>repo init -u https://github.com/nxp-auto-linux/auto_yocto_bsp -b release/bsp32.0
</p>
<p>repo sync
</p>
</code>`<code>
<p>But this still won't work since some meta repo still using the original links of Codeaurora.
</p>
<p>> Automotive Linux BSP (ALB) has been published on CodeAurora Forum (CAF) until BSP 34.0. Starting with BSP 34.0.1, the Automotive Linux BSP releases are published on GitHub. All releases published on CAF have been migrated to GitHub (without changing the Yocto files pointing to CAF links). In order to be able to build Auto Linux BSPs initially published on CAF, a Bash script has been implemented that is able to update the repo manifests and Yocto files, by adapting the CAF git repository links to corresponding NXP GitHub repository links. By using this script, Yocto builds can be performed without the need to pull sources from CAF.
</p>
<p>>
</p>
<p>>> <a href="https://github.com/nxp-auto-linux/linux-bsp-utils/tree/master/codeaurora_migration">Codeaurora_migration</a>
</p>
<p>Download the script in  <a href="https://github.com/nxp-auto-linux/linux-bsp-utils/tree/master/codeaurora_migration">Codeaurora_migration</a> and follow the command resolve my problem:
</p>
</code>`<code>bash
<p>./migrate.sh --full --work_path ./testfolder --release_branch release/bsp32.0
</p>
</code>``
