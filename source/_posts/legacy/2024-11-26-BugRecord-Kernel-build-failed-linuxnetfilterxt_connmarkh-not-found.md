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

<h1>Problem Summary
</h1>
<p>I initially pushed the source kernel code from my Windows 11 PC to my repository by extracting a tar package of the code and uploading it. However, when I cloned the repository on my Ubuntu machine and tried to build the kernel, I encountered the following error:
</p>
<p>``<code>
</p>
<p>net/netfilter/xt_connmark.c:28:41: fatal error: linux/netfilter/xt_connmark.h: No such file or directory
</p>
<p>compilation terminated.
</p>
<p>  LD      net/netfilter/nf_nat.o
</p>
<p>scripts/Makefile.build:258: recipe for target 'net/netfilter/xt_connmark.o' failed
</p>
<p>make[2]: <em>*</em> [net/netfilter/xt_connmark.o] Error 1
</p>
<p>make[2]: <em>*</em> Waiting for unfinished jobs....
</p>
<p>  CC      net/netfilter/ipvs/ip_vs_nfct.o
</p>
<p>  CC      net/netfilter/ipvs/ip_vs_ftp.o
</p>
<p>net/netfilter/xt_hl.c:19:42: fatal error: linux/netfilter_ipv4/ipt_ttl.h: No such file or directory
</p>
<p>compilation terminated.
</p>
</code>`<code>
<h1>Solution Investigation
</h1>
<p>After several attempts to resolve this issue, I traced the problem back to a behavior specific to Windows. When I extracted the source code on my Windows machine, Windows automatically removed the </code>xt_connmark.h<code> file. This happened because Windows couldn't differentiate between </code>xt_connmark.h<code> and </code>xt_CONNMARK.h` due to case-insensitive file system handling. As a result, Windows discarded one of the files, leading to the compilation error.
</p>
<h1>Conclusion
</h1>
<p>The solution is to <strong>never unzip the code on a Windows machine</strong>. Instead, I need to extract the source code on a Linux machine (like Ubuntu), push it to my remote repository, and clone it again on Ubuntu. This avoids the case-sensitivity issue in Windows and allows the kernel to build properly.</p>
