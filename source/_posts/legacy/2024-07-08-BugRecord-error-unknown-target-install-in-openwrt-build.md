---
title: "[BugRecord] error: unknown target 'install' in openwrt build"
date: 2024-07-08 00:00:00
tags:
  - "OpenWRT"
  - "CMake"
categories:
  - "Systems C++"
---

在openwrt中引入自定义的源码编译包时，如果编译系统是CMake，如果没有在CMakeLists.txt中定义安装选项，那么openwrt在编译包时会报错：`error: unknown target 'install' ` 。虽然此时这个包已经编译完成：
![image](https://github.com/quinnwencn/blog/assets/143626366/6c85385c-72e3-4100-8d00-e62265a0835b)

# How to fix
解决方法是在CMakeLists.txt中增加：
```CMakeLists.txt
install(TARGETS ${CMAKE_PROJECT_NAME}
        LIBRARY DESTINATION lib
        INCLUDES DESTINATION include
        RUNTIME DESTINATION bin)
```

[source issue](https://github.com/quinnwencn/blog/issues/56)
