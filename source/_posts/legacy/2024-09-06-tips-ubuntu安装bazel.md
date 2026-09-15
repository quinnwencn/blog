---
title: "[tips] ubuntu安装bazel"
date: 2024-09-06 00:00:00
tags:
  - "Ubuntu"
categories:
  - "Embedded Linux"
---

<li>增加bazel的apt源
</li>
<p>``<code>bash
</p>
<p>echo "deb [arch=amd64] http://storage.googleapis.com/bazel-apt stable jdk1.8" | sudo tee /etc/apt/sources.list.d/bazel.list
</p>
<p>curl https://bazel.build/bazel-release.pub.gpg | sudo apt-key add -
</p>
</code>`<code>
<li>使用apt 安装bazel
</li>
</code>`<code>bash
<p>sudo apt update && sudo apt install bazel
</p>
</code>`<code>
<li>升级到最新版本
</li>
</code>`<code>bash
<p>sudo apt upgrade bazel
</p>
</code>``
