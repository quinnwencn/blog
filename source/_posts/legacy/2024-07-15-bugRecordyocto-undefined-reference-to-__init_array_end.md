---
title: "[bugRecord][yocto]  undefined reference to `__init_array_end'"
date: 2024-07-15 00:00:00
tags:
  - "Yocto"
categories:
  - "Embedded Linux"
---

在yocto的使用中，因为项目需求，需要在整个yocto的工程中使能security_flags，详情参见：[Add security flags to your target](https://github.com/quinnwencn/blog/issues/57)。 但是，在启用这个功能后，遇到了`gstreamer1.0-plugins-bad-qt`编译错误：
```
| /usr/src/debug/glibc/2.24-r0/git/csu/elf-init.c:87: undefined reference to `__init_array_end'
| /usr/src/debug/glibc/2.24-r0/git/csu/elf-init.c:87: undefined reference to `__init_array_start'
```
在使能security_flags特性之前，没有出现这个错误，因此可以判断是security_flags的引入导致的，属于链接相关问题。
解决方法:
1. 在`gstreamer1.0-plugins-bad-qt`的bb文件中，消除security_flags的影响
2. 对`gstreamer1.0-plugins-bad-qt`手动加上安全标志
```
SECURITY_LDFLAGS_pn-xf86-video-fbdev = ""
SECURITY_X_LDFLAGS = ""
SECURITY_LDFLAGS = ""
SECURITY_CFLAGS = ""

CFLAGS_append = " -fstack-protector-strong -fpie -pie"
CXXFLAGS_append = " -fstack-protector-strong "
LDFLAGS_append = " -fstack-protector-strong -Wl,-z,relro,-z,now"
```

[source issue](https://github.com/quinnwencn/blog/issues/59)
