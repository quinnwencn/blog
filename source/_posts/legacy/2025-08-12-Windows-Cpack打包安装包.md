---
title: "[Windows] Cpack打包安装包"
date: 2025-08-12 00:00:00
tags:
  - "legacy"
categories:
  - "Systems C++"
---

CMake管理的工程，可以使用CPack打包成一个安装包，具体命令：
```cmake
cmake -B build -DCMAKE_BUILD_TYPE=Release
cmake --build build --config Release
cmake --install build --prefix build/install
cpack -D CPACK_NSIS_EXECUTABLE="makensis" --config build/CPackConfig.cmake
```

[source issue](https://github.com/quinnwencn/blog/issues/121)
