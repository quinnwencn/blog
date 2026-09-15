---
title: "[Windows DEV] Build a x86 library/application on X86_64 platform"
date: 2025-06-30 00:00:00
tags:
  - "Windows"
categories:
  - "Systems C++"
---

在Windows平台上编译32位的库或者应用，需要安装32位编译工具链，这里采用的是msys2管理的mingw32工具链。
1. 安装32位编译工具链
开启msys2的shell，然后安装工具链：
```bash
pacman -Syu
pacman -S mingw-w64-i686-toolchain
pacman -S cmake
```

2. 如果有其他依赖，也通过msys2 shell安装，比如openssl
```bash
pacman -S pacman -S mingw-w64-i686-openssl
```

3. 编译自定义库或者应用

[source issue](https://github.com/quinnwencn/blog/issues/118)
