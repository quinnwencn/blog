---
title: "[BugRecord] VMWARE的Ubuntu虚拟机无法自动mount共享文件夹"
date: 2024-06-30 00:00:00
tags:
  - "vmware"
categories:
  - "Embedded Linux"
---

在开启vmware的共享文件夹，并设置为总是启用后，可以访问共享文件夹的内容，但是在重新启动后，ubuntu并没有自动mount共享文件夹，原因应该是mnt-hgfs.mount服务没有自动启动，解决方法为：
1. 增加配置到`/etc/systemd/system/mnt-hgfs.mount`，配置内容为：
```
[Unit]
Description=VMware mount for hgfs
DefaultDependencies=no
Before=umount.target
ConditionVirtualization=vmware
After=sys-fs-fuse-connections.mount

[Mount]
What=vmhgfs-fuse
Where=/mnt/hgfs
Type=fuse
Options=default_permissions,allow_other

[Install]
WantedBy=multi-user.target
```
2. 在`/etc/modules-load.d/open-vm-tools.conf`中增加配置（如该配置文件不存在，则新增：
```
fuse
```
3. 使能mnt-hgfs.mount服务并开启：
```
sudo systemctl enable mnt-hgfs.mount && sudo systemctl start mnt-hgfs.mount
```

参考自：https://superuser.com/questions/1731780/vmware-shared-folder-not-showing-on-ubuntu-guest

[source issue](https://github.com/quinnwencn/blog/issues/49)
