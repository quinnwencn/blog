---
title: "[Tips] VMware安装Arch Linux虚拟机"
date: 2025-05-22 00:00:00
tags:
  - "Linux"
  - "vmware"
  - "Arch Linux"
categories:
  - "Systems C++"
---

VMware 上安装Arch Linux不如Ubuntu等方便，需要自定义划分磁盘分区、安装rootfs和bootloader等。本文记录了使用17.6.0 版本的VMware@ Workstation 17 Pro安装2025.05.01 Release版本的[Arch Linux](https://archlinux.org/download/).
 
# VM中安装Arch Linux
1. 下载Arch Linux镜像[Arch Linux官网](https://archlinux.org/download/)提供了对应的磁力下载连接，也可以使用我下载的[链接](magnet:?xt=urn:btih:2e34989b1c60df821b2d046c884d8f4d1858b97a&dn=archlinux-2025.05.01-x86_64.iso)

2. 在VMware中安装
选择`New virtual Machine...`
![Image](https://github.com/user-attachments/assets/771ec0b0-5b47-49b9-a335-d1fb4995f81d)

勾选Typical，然后next，然后选择`Installer dsc image file (iso):` ，选择下载的iso，VMware无法识别Arch Linux，这没关系，点击下一步：
![Image](https://github.com/user-attachments/assets/f0d21fa3-4a5c-46c0-b684-2a6df6e4d4cc)

下一步是选择操作系统：
![Image](https://github.com/user-attachments/assets/fa92e131-a641-4669-bc8d-ce62cb16a697)

这里选择Linux，Version选择Other Linux 6.x kernel 64-bit，然后点击下一步：
![Image](https://github.com/user-attachments/assets/571d347b-d699-4e2b-a4b2-bbed0ad4535d)

在这里输入虚拟机的名字以及存储位置，然后下一步：
![Image](https://github.com/user-attachments/assets/b67ebfb8-8ec1-49bd-8be7-6aeefd383b82)

设置虚拟机的空间大小，我这里设置100GB，存储为一个文件，然后下一步：
![Image](https://github.com/user-attachments/assets/e6fe3fa2-fc63-4f7b-969d-2d306d0083c9)

设置内存大小和处理器数目等硬件信息，然后点击完成。

# Arch Linux内部设置
## 变更启动方式到UEFI启动
Arch Linux安装完成后，先不要直接启动，我们要确认启动方式位UEFI方式，具体操作如下：
1. 右键虚拟机，选择setting
![Image](https://github.com/user-attachments/assets/3d951612-f362-4d40-ac2a-d109d9b16f5e)

2. 选择options
![Image](https://github.com/user-attachments/assets/5b5bf89e-6280-4367-882c-7dfcfe01fcdd)

3. 在advanced里，将Firmware type选择为UEFI
![Image](https://github.com/user-attachments/assets/d3359347-2570-4afd-aa52-8d7ec28ac3ed)

## 启动设置
1. 启动虚拟机，进入虚拟机后，首先验证我们是处于UEFI模式：
```bash
ls /sys/firmware/efi/efivars
```
如果显示`No such file or directory`则表示当前是BIOS模式，需要参照上述步骤，切换成UEFI模式

2. 测试网络可用
```bash
ping www.baidu.com
```
如果无法ping通，则表示网络不可用，请检查网络设置，建议使用NAT模式

3. 更新系统时钟
```bash
timedatectl set-ntp true
```

4. 查看分区
```bash
lsblk
```
此时应看到三个设备，分别是：`sr0`, `loop0`和`sda`， `sda`大小为100GB，这个分区将用来进行分区。

5.  使用工具进行分区，可以使用fdisk，parted以及cfdisk等工具完成，这里我们以cfdisk为例
```bash
cfdisk /dev/sda
```
然后选择gpt类型，按`enter`继续，就可以看到一个100GB的free磁盘，我们需要划分三个分区，分别是：FAT32 EFI分区，ext4的root分区以及一个swap分区。
* FAT32的EFI分区划分
按下`enter`选择new，然后输入500M，按`enter`创建EFT分区，此时可以通过方向键将这个分区改为EFI system类型

* root分区
同样的方式，通过new在剩余的空间上划分98.5GB，用来当作root分区，此时我们不需要划分类型

* swap分区
使用相同的方式，将最后1G划分为swap分区，并将类型改为Linux swap类型。

此时我们将分区划分为三个分区：sda1，sda2和sda3. 通过write将更改写入磁盘，然后选择Quit退出cfdisk。

6. 对磁盘进行初始化
首先需要对swap分区进行初始化：
```bash
mkswap /dev/sda3
swapon /dev/sda3
```
然后，将root分区改为ext4类型：
```bash
mkfs.ext4 /dev/sda2
```

再将EFI分区改为FAT32类型：
```bash
mkfs.fat -F32 /dev/sda1
```

7.  在root分区上创建文件系统
* 挂载root分区
```bash
mount /dev/sda2 /mnt
```
* 创建boot目录，并将EFI分区挂在上去，这将是以后的启动分区
```bash
mkdir /mnt/boot
mount /dev/sda1 /mnt/boot
```
* 将必要的安装包安装到root分区：
```bash
pacstrap /mnt base linux linux-firmware
```

* 创建启动挂载配置：
```bash
genfstab -U /mnt >> /mnt/etc/fstab
```

* chroot到新做好的root分区
```bash
arch-chroot /mnt
```
现在，我们需要定制化时区，定位以及主机名
```bash
ln -sf /usr/share/zoneinfo/Region/City /etc/localtime
ln -sf /usr/share/zoneinfo/US/Eastern /etc/localtime

# install vim
pacman -S vim
vim /etc/locale.conf # Add LANG=en_US.UTF-8

vim /etc/hostname # archvm

vim /etc/hosts
# 127.0.0.1   localhost
# ::1         localhost
# 127.0.1.1   archvm.localdomain  archvm
```

* 在当前启动模式中，我们实际上用的是预配置的网络，为了在重启后仍然可以保持网络可用，需要使用systemctl使能对应配置：
```bash
systemctl enable systemd-networkd
systemctl enable systemd-resolved
```
然后，我们来查看网卡
```bash
ip addr
```
arch linux和ubuntu不一样，在arch linux中使用`ip addr`来查看ip和网卡。我们可以看到，除了lo设备外，还有一个ens33网卡，添加到网络配置文件`/etc/systemd/network/20-wired.network`中：
```bash
[Match]
Name=ens33

[Network]
DCHP=yes
```

* 设置密码
```bash
passwd
```

* 最后，为arch linux安装bootloader，我们使用的是grub：
首先是安装grub和efibootmgr，这样我们就可以使用grub作为bootloader：
```bash
pacman -S grub efibootmgr
```
接下来，安装grub bootloader到EFI分区
```bash
grub-install --target=x86_64-efi --efi-directory=/boot --bootloader-id=GRUB
```
此时需要注意，如果没有通过UEFI启动，那么此时会报错：
```
Installing for x86_64-efi platform. 
EFI variables are not supported on this system.
EFI variables are not supported on this system.
grub-install: error: efibootmgr failed to register the boot entry: No such file or directory.
```
如果是这样，只能关闭arch linux，并按照前面的步骤，改为UEFI类型后再次安装grub。
接下来，我们为系统生成grub配置文件：
```bash
grub-mkconfig -o /boot/grub/grub.cfg
```
完成后，就可以退出重启了：
```bash
exit
umount -R /mnt
reboot
```
此时，就可以从安装的Arch Linux启动了！

[source issue](https://github.com/quinnwencn/blog/issues/117)
