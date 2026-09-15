---
title: "[Yocto][BugRecord] do_package_qa: QA Issue: package xxx contains bad RPATH"
date: 2024-08-10 00:00:00
tags:
  - "Yocto"
categories:
  - "Systems C++"
---

<p>在自定义包编译时，遇到了这个问题：
</p>
<img width="734" alt="image" src="https://github.com/user-attachments/assets/9fcd356e-1e85-44b5-8522-6cd132e806ac">
<p>这个工程是CMAKE编译的，解决方法：
</p>
<p>``<code>cmake
</p>
<p>SET(CMAKE_SKIP_BUILD_RPATH  TRUE)
</p>
<p>SET(CMAKE_BUILD_WITH_INSTALL_RPATH FALSE)
</p>
<p>SET(CMAKE_INSTALL_RPATH_USE_LINK_PATH FALSE)
</p>
</code>``
<p>原因暂未知
</p>
