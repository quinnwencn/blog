---
title: "[C++] Windows上CMake编译Qt应用"
date: 2025-05-03 00:00:00
tags:
  - "CMake"
  - "C/C++"
  - "Qt"
categories:
  - "Systems C++"
---

# CMake编译找不到Qt库的问题
由于Windows开发环境的不稳定性，尽管Windows上已经安装了Qt，但是在基于CMake的开发工程下（不使用Qt Creator，直接使用VS Code搭建的Qt工程），仍然有可能因为找不到Cmake而报错：
```bash
By not providing "FindQt6.cmake" in CMAKE_MODULE_PATH this project has
  asked CMake to find a package configuration file provided by "Qt6", but
  CMake did not find one.

  Could not find a package configuration file provided by "Qt6" with any of
  the following names:

    Qt6Config.cmake
    qt6-config.cmake
```
此时，就需要手动告诉CMake，我的Qt安装包在哪里。这是因为在Linux上，CMake会默认去`/usr/share/cmake-xxx/Modules`查找对应依赖的`FindXXX.cmake`或者`XXXConfig.cmake`、`XXX-config.cmake`，用来在CMake中使用`find_package`查找。而在windows上并没有对应的目录，Qt安装目录的不同，就导致CMake无法找到Qt提供的QtXConfig.cmake，因此需要手动提供Qt的安装目录下的lib目录，以便编译时能查找依赖包：
```bash
cmake -DCMAKE_PREFIX_PATH="C:\Qt\6.8.0\mingw_64" -Bbuild
```
这样就可以解决Widnows上编译Qt的问题。

# Qt库找不到的问题
但是，在编译后，如果直接运行编译后的exe文件，会出现Qt库找不到的问题，如下所示：
![Image](https://github.com/user-attachments/assets/58ffce3a-414d-4844-9d24-9da25d81eb92)

这个问题也同样是因为Qt的安装目录下的所有库，对于Widnows的链接器而言都是未知的，因此可以通过拷贝的方式解决，Qt提供了deploy工具，可以一键拷贝所需的库到目标目录，并且是根据编译后的exe依赖的库拷贝，不会遗漏，也不会有不需要的库：
```bash
C:\Qt\6.8.0\mingw_64\bin\windeployqt.exe path\to\myapp.exe
```

# Clion中的配置
## 解决CMake编译找不到Qt库的问题
在configurations中定义环境变量
![Image](https://github.com/user-attachments/assets/205307ed-7bd7-43a8-8cfa-9d174a25b210)
选择`Edit Configurations`

在`Environment variables`中增加参数：
![Image](https://github.com/user-attachments/assets/aa55f53f-7a0e-412c-8147-74a10a45c0c7)

## 解决运行时丢失库的问题
还是在`Edit Configurations`中，在`Before launch`中增加一个命令：`Run External tool`,然后新增一个命令，名字改为`Deploy Qt Libraries`，并增加描述，`Program`填写命令的路径，`Arguments`填写参数，对于我们而言，参数是`$CMakeCurrentBuildDir$\$ProjectName$.exe`，然后`Working directory`是：`$ProjectFileDir$`，具体如下图：

![Image](https://github.com/user-attachments/assets/3b0de447-284e-4e6e-826d-2050af089978)

[source issue](https://github.com/quinnwencn/blog/issues/116)
