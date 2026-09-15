---
title: "[Windows DEV] Build a x86 library/application on X86_64 platform"
date: 2025-06-30 00:00:00
tags:
  - "Windows"
categories:
  - "Systems C++"
---

<p>在Windows平台上编译32位的库或者应用，需要安装32位编译工具链，这里采用的是msys2管理的mingw32工具链。</p>
<li>安装32位编译工具链</li>
<p>开启msys2的shell，然后安装工具链：</p>
<p>``<code>bash</p>
<p>pacman -Syu</p>
<p>pacman -S mingw-w64-i686-toolchain</p>
<p>pacman -S cmake</p>
</code>`<code>
<li>如果有其他依赖，也通过msys2 shell安装，比如openssl</li>
</code>`<code>bash
<p>pacman -S pacman -S mingw-w64-i686-openssl</p>
</code>``
<li>编译自定义库或者应用</li>
