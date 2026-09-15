---
title: "[tips] ubuntu安装bazel"
date: 2024-09-06 00:00:00
tags:
  - "Ubuntu"
categories:
  - "Embedded Linux"
---

1. 增加bazel的apt源
```bash
echo "deb [arch=amd64] http://storage.googleapis.com/bazel-apt stable jdk1.8" | sudo tee /etc/apt/sources.list.d/bazel.list
curl https://bazel.build/bazel-release.pub.gpg | sudo apt-key add -
```
2. 使用apt 安装bazel
```bash
sudo apt update && sudo apt install bazel
```
3. 升级到最新版本
```bash
sudo apt upgrade bazel
```

[source issue](https://github.com/quinnwencn/blog/issues/68)
