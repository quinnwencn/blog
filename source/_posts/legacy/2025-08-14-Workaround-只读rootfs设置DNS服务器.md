---
title: "[Workaround] 只读rootfs设置DNS服务器"
date: 2025-08-14 00:00:00
tags:
  - "Linux"
categories:
  - "Embedded Linux"
---

<h1>背景</h1>
<p>嵌入式设备，rootfs开启了dm-verity，mount为read only，无法通过修改<code>/etc/resolv.conf</code>，但仍然需要增加自定义DNS服务器。</p>
<h1>解决办法</h1>
<p>``<code></p>
<p>echo "nameserver xx.xx.xx.xx" | sudo resolvconf -a interface(eth 0)</p>
</code>``
