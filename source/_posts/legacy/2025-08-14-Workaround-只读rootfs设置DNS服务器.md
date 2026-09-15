---
title: "[Workaround] 只读rootfs设置DNS服务器"
date: 2025-08-14 00:00:00
tags:
  - "Linux"
categories:
  - "Embedded Linux"
---

# 背景
嵌入式设备，rootfs开启了dm-verity，mount为read only，无法通过修改`/etc/resolv.conf`，但仍然需要增加自定义DNS服务器。

# 解决办法
```
echo "nameserver xx.xx.xx.xx" | sudo resolvconf -a interface(eth 0)
```

[source issue](https://github.com/quinnwencn/blog/issues/122)
