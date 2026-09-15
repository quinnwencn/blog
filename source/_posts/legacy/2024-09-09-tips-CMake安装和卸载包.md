---
title: "[tips] CMake安装和卸载包"
date: 2024-09-09 00:00:00
tags:
  - "CMake"
categories:
  - "Systems C++"
---

<li>从源码安装
</li>
<p>``<code> bash
</p>
<p>cmake --build build --target install
</p>
</code>`<code>
<li>卸载从源码安装的包：
</li>
</code>`<code>bash
<p>cat build/install_manifest.txt | sudo xargs rm
</p>
</code>``
