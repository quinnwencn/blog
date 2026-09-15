---
title: "[BugRecord] 交叉编译后执行报错`Illegal Instruction` 或者 在main函数前就`Segmentation fault`"
date: 2024-06-21 00:00:00
tags:
  - "bug"
categories:
  - "Systems C++"
---

# 背景
在一个项目中，我需要开发一个库，提供给第三方使用，具体是提供一个so和一个头文件。我需要在提交前自研功能，按理这是一个非常简单的活，但是由于疏忽，导致在一个很小的问题上耗费了一天多时间，这里记录下.
# 问题
在验证时，发生了以下两个错误：
![image](https://github.com/quinnwencn/blog/assets/143626366/ea1ae4e0-f54d-48d1-a949-784a3bdd02d2)
这两个错误并不是有规律出现，同一个二进制，时而是`Illegal Instruction`，时而是`Segmentation fault`。因此可以判断不是代码本身存在段错误。我甚至在同级Makefile编译下创建了一个helloworld，结果还是一样的问题：
![image](https://github.com/quinnwencn/blog/assets/143626366/9bdc675e-6496-414c-84b8-9754adc3bb1f)
最后，迫不得已，重新编写Makefile才解决问题。原因是Makefile拷贝自库的编译Makefile，链接是制定了标志:`shared`，因此导致链接出来的实际上不是可执行文件，而是一个一个库。

[source issue](https://github.com/quinnwencn/blog/issues/45)
