---
title: "[SecureBoot] Boot flow of MCU"
date: 2024-06-18 00:00:00
tags:
  - "SecureBoot"
  - "Cortex-M"
categories:
  - "Systems C++"
---

# 未开启Secure boot的MCU启动流程：
![image](https://github.com/robertwenhk/blog/assets/143626366/c7a67443-a409-46f7-8f85-0ea5daaa4125)
未开启secure boot时，CPU上电后，bootrom就会获取bootloader的大小，并直接load和执行bootloader，然后将控制权转交CPU执行bootloader。
 
# 开启secure boot的MCU启动流程：
![image](https://github.com/robertwenhk/blog/assets/143626366/7c76afd6-69e8-4b3b-a86c-9a6689525cfa)

开启Secure Boot后，执行流程为：
1. CPU上电
2. BootROM获取bootloader大小
3. BootROM检测是否开启secure boot(检测方式可以是检查是否有boot_key，也可以是检查fuse上的位数，根据芯片厂商方案而定）
4. 开启secure boot后，将控制权转交SHE/HSM等硬件安全模块
5. SHE/HSM读取boot_key
6. BootROM读取bootloader
7. SHE/HSM根据读取的bootloader计算MAC
8. 基于CMAC算法计算BOOT_MAC
9. SHE/HSM对比MAC和BOOT_MAC
10. 相等则正常启动bootloader，不相等则限制访问

可以看出，要使能Secure Boot，有两个必要条件：
* 具备SHE/HSM等硬件安全模块，有些芯片内置CRYPTO模块，原理类似(如STM32F77x系列）
* BootROM的支持
由于STM32F767并不支持以上两个条件，因此从原理上，该芯片无法使能Secure Boot.

[source issue](https://github.com/quinnwencn/blog/issues/43)
