---
title: "[BugRecord] Kernel build failed: linux/netfilter/xt_connmark.h not found"
date: 2024-11-26 00:00:00
tags:
  - "bug"
  - "Linux"
  - "Windows"
categories:
  - "Embedded Linux"
---

# Problem Summary
I initially pushed the source kernel code from my Windows 11 PC to my repository by extracting a tar package of the code and uploading it. However, when I cloned the repository on my Ubuntu machine and tried to build the kernel, I encountered the following error:
```
net/netfilter/xt_connmark.c:28:41: fatal error: linux/netfilter/xt_connmark.h: No such file or directory
compilation terminated.
  LD      net/netfilter/nf_nat.o
scripts/Makefile.build:258: recipe for target 'net/netfilter/xt_connmark.o' failed
make[2]: *** [net/netfilter/xt_connmark.o] Error 1
make[2]: *** Waiting for unfinished jobs....
  CC      net/netfilter/ipvs/ip_vs_nfct.o
  CC      net/netfilter/ipvs/ip_vs_ftp.o
net/netfilter/xt_hl.c:19:42: fatal error: linux/netfilter_ipv4/ipt_ttl.h: No such file or directory
compilation terminated.
```
# Solution Investigation
After several attempts to resolve this issue, I traced the problem back to a behavior specific to Windows. When I extracted the source code on my Windows machine, Windows automatically removed the `xt_connmark.h` file. This happened because Windows couldn't differentiate between `xt_connmark.h` and `xt_CONNMARK.h` due to case-insensitive file system handling. As a result, Windows discarded one of the files, leading to the compilation error.

# Conclusion
The solution is to **never unzip the code on a Windows machine**. Instead, I need to extract the source code on a Linux machine (like Ubuntu), push it to my remote repository, and clone it again on Ubuntu. This avoids the case-sensitivity issue in Windows and allows the kernel to build properly.

[source issue](https://github.com/quinnwencn/blog/issues/76)
