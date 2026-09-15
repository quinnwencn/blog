---
title: "[Tips] Setup static IP address for Ethernet interface in Linux"
date: 2024-12-04 00:00:00
tags:
  - "Linux"
  - "Config"
categories:
  - "Systems C++"
---

<p>For operating systems  that use Netplan to manage the network settings, you can easily configure a  static IP address for an Ethernet interface by adding the appropriate settings in the <code>/etc/netplan/01-network-manager-all.yaml</code> file.
</p>
<p>Original config:
</p>
<p>``<code>bash
</p>
<p>#Let NetworkManager manage all devices on this system
</p>
<p>network:
</p>
<p>  version: 2
</p>
<p>  renderer: NetworkManager
</p>
</code>`<code>
<p>Add a configuration for an interface:
</p>
</code>`<code>bash
<h1>Let NetworkManager manage all devices on this system
</h1>
<p>network:
</p>
<p>  version: 2
</p>
<p>  renderer: NetworkManager
</p>
<p>  ethernets:
</p>
<p>    enxf8e43b4f721f:
</p>
<p>      dhcp4: no
</p>
<p>      addresses: [192.168.18.100/20]
</p>
<p>      gateway4: 192.168.18.1
</p>
<p>      nameservers:
</p>
<p>        addresses: [8.8.8.8,8.8.8.4]
</p>
</code>`<code>
<p>Run </code>sudo netplan try<code> and enter </code>Enter` to make configuration works.</p>
