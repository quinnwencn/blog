---
title: "[BugRecord] error: unknown target 'install' in openwrt build"
date: 2024-07-08 00:00:00
tags:
  - "OpenWRT"
  - "CMake"
categories:
  - "Systems C++"
---

<p>在openwrt中引入自定义的源码编译包时，如果编译系统是CMake，如果没有在CMakeLists.txt中定义安装选项，那么openwrt在编译包时会报错：<code>error: unknown target 'install' </code> 。虽然此时这个包已经编译完成：
</p>
<img src="https://github.com/quinnwencn/blog/assets/143626366/6c85385c-72e3-4100-8d00-e62265a0835b" alt="image" style="max-width:100%;">
<h1>How to fix
</h1>
<p>解决方法是在CMakeLists.txt中增加：
</p>
<p>``<code>CMakeLists.txt
</p>
<p>install(TARGETS ${CMAKE_PROJECT_NAME}
</p>
<p>        LIBRARY DESTINATION lib
</p>
<p>        INCLUDES DESTINATION include
</p>
<p>        RUNTIME DESTINATION bin)
</p>
</code>``
