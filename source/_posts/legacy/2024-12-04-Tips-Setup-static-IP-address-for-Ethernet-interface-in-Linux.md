---
title: "[Tips] Setup static IP address for Ethernet interface in Linux"
date: 2024-12-04 00:00:00
tags:
  - "Linux"
  - "Config"
categories:
  - "Systems C++"
---

For operating systems  that use Netplan to manage the network settings, you can easily configure a  static IP address for an Ethernet interface by adding the appropriate settings in the `/etc/netplan/01-network-manager-all.yaml` file.
Original config:
```bash
#Let NetworkManager manage all devices on this system
network:
  version: 2
  renderer: NetworkManager
```
Add a configuration for an interface:
```bash
# Let NetworkManager manage all devices on this system
network:
  version: 2
  renderer: NetworkManager
  ethernets:
    enxf8e43b4f721f:
      dhcp4: no
      addresses: [192.168.18.100/20]
      gateway4: 192.168.18.1
      nameservers:
        addresses: [8.8.8.8,8.8.8.4]

```

Run `sudo netplan try` and enter `Enter` to make configuration works.

[source issue](https://github.com/quinnwencn/blog/issues/81)
