---
title: "[Windows] Cpack打包安装包"
date: 2025-08-12 00:00:00
tags:
  - "legacy"
categories:
  - "Systems C++"
---

<p>CMake管理的工程，可以使用CPack打包成一个安装包，具体命令：</p>
<p>``<code>cmake</p>
<p>cmake -B build -DCMAKE_BUILD_TYPE=Release</p>
<p>cmake --build build --config Release</p>
<p>cmake --install build --prefix build/install</p>
<p>cpack -D CPACK_NSIS_EXECUTABLE="makensis" --config build/CPackConfig.cmake</p>
</code>``
