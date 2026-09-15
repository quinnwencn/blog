---
title: "[bugRecord][yocto]  undefined reference to `__init_array_end'"
date: 2024-07-15 00:00:00
tags:
  - "Yocto"
categories:
  - "Embedded Linux"
---

<p>在yocto的使用中，因为项目需求，需要在整个yocto的工程中使能security_flags，详情参见：<a href="https://github.com/quinnwencn/blog/issues/57">Add security flags to your target</a>。 但是，在启用这个功能后，遇到了<code>gstreamer1.0-plugins-bad-qt</code>编译错误：
</p>
<p>``<code>
</p>
<p>| /usr/src/debug/glibc/2.24-r0/git/csu/elf-init.c:87: undefined reference to </code>__init_array_end'
</p>
<p>| /usr/src/debug/glibc/2.24-r0/git/csu/elf-init.c:87: undefined reference to <code>__init_array_start'
</p>
</code>`<code>
<p>在使能security_flags特性之前，没有出现这个错误，因此可以判断是security_flags的引入导致的，属于链接相关问题。
</p>
<p>解决方法:
</p>
<li>在</code>gstreamer1.0-plugins-bad-qt<code>的bb文件中，消除security_flags的影响
</li>
<li>对</code>gstreamer1.0-plugins-bad-qt<code>手动加上安全标志
</li>
</code>`<code>
<p>SECURITY_LDFLAGS_pn-xf86-video-fbdev = ""
</p>
<p>SECURITY_X_LDFLAGS = ""
</p>
<p>SECURITY_LDFLAGS = ""
</p>
<p>SECURITY_CFLAGS = ""
</p>
<p>CFLAGS_append = " -fstack-protector-strong -fpie -pie"
</p>
<p>CXXFLAGS_append = " -fstack-protector-strong "
</p>
<p>LDFLAGS_append = " -fstack-protector-strong -Wl,-z,relro,-z,now"
</p>
</code>``
