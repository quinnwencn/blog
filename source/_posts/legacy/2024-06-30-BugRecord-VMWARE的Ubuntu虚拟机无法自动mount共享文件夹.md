---
title: "[BugRecord] VMWARE的Ubuntu虚拟机无法自动mount共享文件夹"
date: 2024-06-30 00:00:00
tags:
  - "vmware"
categories:
  - "Embedded Linux"
---

<p>在开启vmware的共享文件夹，并设置为总是启用后，可以访问共享文件夹的内容，但是在重新启动后，ubuntu并没有自动mount共享文件夹，原因应该是mnt-hgfs.mount服务没有自动启动，解决方法为：
</p>
<li>增加配置到<code>/etc/systemd/system/mnt-hgfs.mount</code>，配置内容为：
</li>
<p>``<code>
</p>
<p>[Unit]
</p>
<p>Description=VMware mount for hgfs
</p>
<p>DefaultDependencies=no
</p>
<p>Before=umount.target
</p>
<p>ConditionVirtualization=vmware
</p>
<p>After=sys-fs-fuse-connections.mount
</p>
<p>[Mount]
</p>
<p>What=vmhgfs-fuse
</p>
<p>Where=/mnt/hgfs
</p>
<p>Type=fuse
</p>
<p>Options=default_permissions,allow_other
</p>
<p>[Install]
</p>
<p>WantedBy=multi-user.target
</p>
</code>`<code>
<li>在</code>/etc/modules-load.d/open-vm-tools.conf<code>中增加配置（如该配置文件不存在，则新增：
</li>
</code>`<code>
<p>fuse
</p>
</code>`<code>
<li>使能mnt-hgfs.mount服务并开启：
</li>
</code>`<code>
<p>sudo systemctl enable mnt-hgfs.mount && sudo systemctl start mnt-hgfs.mount
</p>
</code>``
<p>参考自：https://superuser.com/questions/1731780/vmware-shared-folder-not-showing-on-ubuntu-guest</p>
