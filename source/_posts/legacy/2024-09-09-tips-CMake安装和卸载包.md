---
title: "[tips] CMake安装和卸载包"
date: 2024-09-09 00:00:00
tags:
  - "CMake"
categories:
  - "Systems C++"
---

1. 从源码安装
``` bash
cmake --build build --target install
```
2. 卸载从源码安装的包：
```bash
cat build/install_manifest.txt | sudo xargs rm
```

[source issue](https://github.com/quinnwencn/blog/issues/69)
