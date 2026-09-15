---
title: "[linux][driver] Disable USB keyboard using ko"
date: 2024-11-05 00:00:00
tags:
  - "Linux"
  - "driver"
categories:
  - "Embedded Linux"
---

在linux的设备管理中，USB的人机交互设备（Human Interface Device）有统一的ko进行管理：USBHID，根据nxp的kconfig描述，基于USBHID还衍生了USBKBD，专门用于管理键盘，但是USBKBD和USBHID不是与的关系，用了USBKBD，就无法用USBHID去加载键盘，详细信息查看[kconfig](https://github.com/nxp-imx/linux-imx/blob/imx_4.14.98_2.0.13/drivers/hid/usbhid/Kconfig)。
但是，在项目中，把usbkbd.ko去除后，还是自动通过usbhid.ko识别并加载了键盘。这应该也是从另一个角度说明了，usbkbd和usbhid的关系，如果有usbkbd，就通过usbkbd去识别和加载键盘，否则就通过usbhid识别和加载。
在runtime中，通过将usbhid.ko和usbkbd.ko改名为usbhid.ko.old和usbkbd.ko.old后，设备无法加载识别键盘，这可以通过dmesg和/dev/input/event2查看和验证。因此第一版本的修改思路就是将ko改名：将usbhid.ko改为invisibleusbhid.ko，usbkbd.ko改为invisibleusbkbd.ko。但是验证后还是能识别键盘，经过定位发现在编译时，生成了一个文件：
```
sudo grep -rn "invisibleusbhid.ko"
```
![image](https://github.com/user-attachments/assets/3c608aa5-aede-4b0a-b1a6-3a7ffa8e066c)

因此，有理由怀疑，在do_install_apend里改名字，也会被记录到内核ko的属性中，因此无法通过改名实现。因此直接在do_install_append中将这两个ko删除了，最后验证通过。

[source issue](https://github.com/quinnwencn/blog/issues/74)
