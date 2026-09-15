---
title: "03 ATF(Arm Trusted Firmware)介绍和仿真"
date: 2025-02-28 00:00:00
tags:
  - "TrustZone"
  - "TEE"
  - "ARMv8"
categories:
  - "Embedded Linux"
---

# ATF的启动流程
从TF-A（Arm-Trusted-Firmware）的启动流程可以看出，支持TrustZone的SoC的启动从BootROM开始，BootROM被称为BL1，然后BL1启动BL2，BL2启动BL31，BL31负责启动BL32和BL33，最后才是Kernel的启动：
![image](https://github.com/user-attachments/assets/1855f30f-fe1d-416a-92bc-97afe4b8197e)

其中的一些概念：
* TF-A(ATF, Arm-Trusted-Firmware)：ARM安全固件，运行再EL3异常级别，我们常说的ATF实际上包括了BL1、BL2和BL31.
* BL1： BootROM芯片上一块只读的代码区，具有最高的执行权限EL3。这段代码由芯片厂商编写，并在出厂时就固化为只读，厂商自己也无法更改，这也是Secure Boot的信任锚。
* BL2：平台初始化固件，用来完成平台相关的初始化，比如对DDR的初始化等，因为BL31和BL32是一个runtime，所以在加载之前必须初始化设备的DDR，这就是有BL2完成的。
* BL31：BL31实际上是一个常驻的runtime，负责为Non-Secure和Secure world之间的SMC指令提供服务和切换，BL31完成了硬件抽象的作用，为上层的OS（或者是virtualization）提供服务，同时完成一些EL3级别的指令，比如关机、睡眠等，这个固件也是由芯片厂商支持实现。
* BL32：BL32就是我们常说的TEE OS，比如常见的op-tee或者trustonic等厂商开发的Secure OS，在Secure OS上通常还会有对应的Trusted Application(TA)，BL32运行在EL1中（Secure World没有EL2）。
* BL33：BL33是Non-Secure World（或者说Normal World）的非安全固件，一般就是UEFI或者u-boot，作用是启动Normal World的REE OS，比如Linux等，u-boot也运行在EL3。

这几个固件的启动过程如下：
```bash
BL1 --> BL2 --> BL31 -->BL32 --> BL33 --> REE OS
```

# 试验
我们可以通过qemu来仿真查看这一套的启动流程，但是手动仿真目前暂时无法拉起TEE OS，因此我们将观察BL1启动到BL33，也就是u-boot的过程。

## ATF 代码编译
ARM的github仓库中，提供了完整的ATF代码，我们使用官方提供的ATF代码来演示：
* 下载ATF代码
```bash
git clone https://github.com/ARM-software/arm-trusted-firmware.git
```
* 交叉编译工具安装
由于目前我们仿真的是ARMv8的架构，ARMv8.2架构中有一条esb指令，在低版本的gcc编译器中无法识别，如果使用的是ubuntu-20.04，那么默认的aarch-linux-gnu-gcc 9.x版本将无法通过编译：
```bash
$ make CROSS_COMPILE=aarch64-linux-gnu- PLAT=qemu DEBUG=1 all
Building qemu
  AS      lib/cpus/aarch64/neoverse_n1.S
lib/cpus/aarch64/neoverse_n1.S: Assembler messages:
lib/cpus/aarch64/neoverse_n1.S:277: Error: selected processor does not support `esb'
make: *** [Makefile:1563: /mnt/disk/study/tee-docker/arm-trusted-firmware/build/qemu/debug/bl1/neoverse_n1.o] Error 1
```
我们需要从ARM官网或者是Linaro官网下载对应的编译器版本才行，我使用的是[ARM的13.2版本的编译器](https://developer.arm.com/-/media/Files/downloads/gnu/13.2.rel1/binrel/arm-gnu-toolchain-13.2.rel1-x86_64-aarch64-none-linux-gnu.tar.xz )。
安装编译器：
```bash
sudo mkdir -p /opt/toolchain
wget https://developer.arm.com/-/media/Files/downloads/gnu/13.2.rel1/binrel/arm-gnu-toolchain-13.2.rel1-x86_64-aarch64-none-linux-gnu.tar.xz 
tar -xvf arm-gnu-toolchain-13.2.rel1-x86_64-aarch64-none-linux-gnu.tar.xz  -C  /opt/toolchain
export PATH=/opt/toolchain/arm-gnu-toolchain-13.2.Rel1-x86_64-aarch64-none-linux-gnu/bin:$PATH
```
然后再编译
```bash
make CROSS_COMPILE=aarch64-none-linux-gnu-  PLAT=qemu DEBUG=1 all
```
编译完成后，会在`build/qemu/debug`目录下生成bl1.bin, bl2.bin和bl3.bin：
```bash
$ ll build/qemu/debug/
total 160K
drwxrwxr-x 3 quanwen quanwen 4.0K 2月  27 17:02 bl1
-rwxrwxr-x 1 quanwen quanwen  33K 2月  27 17:02 bl1.bin
drwxrwxr-x 3 quanwen quanwen 4.0K 2月  27 17:02 bl2
-rwxrwxr-x 1 quanwen quanwen  33K 2月  27 17:02 bl2.bin
drwxrwxr-x 3 quanwen quanwen 4.0K 2月  27 17:02 bl31
-rwxrwxr-x 1 quanwen quanwen  61K 2月  27 17:02 bl31.bin
drwxrwxr-x 2 quanwen quanwen 4.0K 2月  27 16:38 lib
drwxrwxr-x 2 quanwen quanwen 4.0K 2月  27 16:38 libc
drwxrwxr-x 2 quanwen quanwen 4.0K 2月  27 16:38 libfdt

```
如果不考虑BL33.bin的运行，我们现在就可以通过qemu仿真运行ATF：
```bash
$ qemu-system-aarch64 -nographic -machine virt,secure=on \
-cpu cortex-a53 \
-smp 2 -m 2048 \
-d guest_errors,unimp \
-bios ./bl1.bin \
-semihosting-config enable=on,target=native
```
![Image](https://github.com/user-attachments/assets/e5d4990b-cd8d-4753-b040-049f91e82ec7)

由于缺失BL33.bin，BL2.bin再检查时会失败，所以只运行到了BL2.bin。这些Image内部也有排序，BL1是Image 1，BL2 是Image 2，BL31是Image 3， BL32 是Image 4, BL33是Image 5。由于Secure OS可能并不会运行，因此缺失Image 4是没问题的，但是BL33是必须的，所以上图就是因为缺失Image 5（BL33，也就是u-boot）而报错停止。

## u-boot代码编译
* 从官方仓库下载u-boot代码：
```bash
git clone https://github.com/u-boot/u-boot.git
```
* 编译u-boot
```bash

cd u-boot
export ARCH=arm64
export CROSS_COMPILE=aarch64-none-linux-gnu-
make qemu_arm64_defconfig
make -j16
```
为了方便调试，我们在某个位置创建blxx.bin的软连接：
```
ln -s ../official-uboot/u-boot/u-boot.bin ./bl33.bin
ln -s ../arm-trusted-firmware/build/qemu/debug/bl31.bin bl31.bin
ln -s ../arm-trusted-firmware/build/qemu/debug/bl2bin  bl2.bin
ln -s ../arm-trusted-firmware/build/qemu/debug/bl1.bin bl1.bin
```
然后再运行：
```bash
$ qemu-system-aarch64 -nographic -machine virt,secure=on \
-cpu cortex-a53 \
-smp 2 -m 2048 \
-d guest_errors,unimp \
-bios ./bl1.bin \
-semihosting-config enable=on,target=native
NOTICE:  Booting Trusted Firmware
NOTICE:  BL1: v2.12.0(debug):v2.12.0-626-gbac623d18
NOTICE:  BL1: Built : 16:38:30, Feb 27 2025
INFO:    BL1: RAM 0xe0ee000 - 0xe0f6000
WARNING: BL1: cortex_a53: CPU workaround for erratum 835769 was missing!
WARNING: BL1: cortex_a53: CPU workaround for erratum 843419 was missing!
WARNING: BL1: cortex_a53: CPU workaround for erratum 855873 was missing!
WARNING: BL1: cortex_a53: CPU workaround for erratum 1530924 was missing!
INFO:    BL1: Loading BL2
WARNING: Firmware Image Package header check failed.
INFO:    Loading image id=1 at address 0xe05b000
INFO:    Image id=1 loaded: 0xe05b000 - 0xe063201
NOTICE:  BL1: Booting BL2
INFO:    Entry point address = 0xe05b000
INFO:    SPSR = 0x3c5
NOTICE:  BL2: v2.12.0(debug):v2.12.0-626-gbac623d18
NOTICE:  BL2: Built : 17:02:10, Feb 27 2025
INFO:    BL2: Doing platform setup
INFO:    BL2: Loading image id 3
WARNING: Firmware Image Package header check failed.
INFO:    Loading image id=3 at address 0xe090000
INFO:    Image id=3 loaded: 0xe090000 - 0xe09f0c4
INFO:    BL2: Loading image id 5
WARNING: Firmware Image Package header check failed.
INFO:    Loading image id=5 at address 0x60000000
INFO:    Image id=5 loaded: 0x60000000 - 0x60115578
NOTICE:  BL1: Booting BL31
INFO:    Entry point address = 0xe090000
INFO:    SPSR = 0x3cd
NOTICE:  BL31: v2.12.0(debug):v2.12.0-626-gbac623d18
NOTICE:  BL31: Built : 17:02:11, Feb 27 2025
INFO:    ARM GICv2 driver initialized
INFO:    BL31: Initializing runtime services
WARNING: BL31: cortex_a53: CPU workaround for erratum 835769 was missing!
WARNING: BL31: cortex_a53: CPU workaround for erratum 843419 was missing!
WARNING: BL31: cortex_a53: CPU workaround for erratum 855873 was missing!
WARNING: BL31: cortex_a53: CPU workaround for erratum 1530924 was missing!
INFO:    BL31: Preparing for EL3 exit to normal world
INFO:    Entry point address = 0x60000000
INFO:    SPSR = 0x3c5
Bloblist at 0 not found (err=-2)
alloc space exhausted ptr 400 limit 0
Bloblist at 0 not found (err=-2)


U-Boot 2025.04-rc3-00014-gb78f8677cde8 (Feb 28 2025 - 17:52:30 +0800)

DRAM:  2 GiB
Core:  51 devices, 14 uclasses, devicetree: board
Flash: 32 MiB
Loading Environment from Flash... *** Warning - bad CRC, using default environment

In:    serial,usbkbd
Out:   serial,vidconsole
Err:   serial,vidconsole
No USB controllers found
Net:   eth0: virtio-net#32

starting USB...
No USB controllers found
Hit any key to stop autoboot:  0 
Scanning for bootflows in all bootdevs
Seq  Method       State   Uclass    Part  Name                      Filename
---  -----------  ------  --------  ----  ------------------------  ----------------
Scanning global bootmeth 'efi_mgr':
Cannot persist EFI variables without system partition
Missing TPMv2 device for EFI_TCG_PROTOCOL
Missing RNG device for EFI_RNG_PROTOCOL
Scanning bootdev 'fw-cfg@9020000.bootdev':
fatal: no kernel available
No USB controllers found
scanning bus for devices...
Scanning bootdev 'virtio-net#32.bootdev':
BOOTP broadcast 1
DHCP client bound to address 10.0.2.15 (1 ms)
*** Warning: no boot file name; using '0A00020F.img'
Using virtio-net#32 device
TFTP from server 10.0.2.2; our IP address is 10.0.2.15
Filename '0A00020F.img'.
Load address: 0x40400000
Loading: *
TFTP error: 'Access violation' (2)
Not retrying...
No more bootdevs
---  -----------  ------  --------  ----  ------------------------  ----------------
(0 bootflows, 0 valid)
=> version
U-Boot 2025.04-rc3-00014-gb78f8677cde8 (Feb 28 2025 - 17:52:30 +0800)

```
可以看到，u-boot也成功启动了。

[source issue](https://github.com/quinnwencn/blog/issues/111)
