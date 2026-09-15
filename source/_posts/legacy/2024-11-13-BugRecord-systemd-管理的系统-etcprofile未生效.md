---
title: "[BugRecord] systemd 管理的系统 /etc/profile未生效"
date: 2024-11-13 00:00:00
tags:
  - "bug"
categories:
  - "Embedded Linux"
---

在一个项目中，应用层的二进制，需要打包一个库放到系统中的/custom_app目录中，二进制依赖这个库运行，但是在编译打包时，将:
```
LD_LIBRARY_PATH=$LD_LIBRARY_PATH:/custom_app
export LD_LIBRARY_PATH
```
加入`/etc/profile`后，重启设备，改二进制还是因为找不到库而无法运行

[source issue](https://github.com/quinnwencn/blog/issues/75)
