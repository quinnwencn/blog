---
title: "[WSL] enable ssh access from another PC on WSL"
date: 2025-11-07 00:00:00
tags:
  - "WSL"
categories:
  - "Systems C++"
---

Since WSL does not have an independent network interface exported on the local network, other PCs can't access it. But we can use host windows to redirect ssh port to WSL.

# Command
On the host Windows system, open a shell using the administrator role, and execute the following command:
```sh
netsh interface portproxy add v4tov4 listenport=[windows port] listenaddress=0.0.0.0 connectport=[wsl port] connectaddress=[wsl address]
```

After the command is executed, any PC from the same local address should be able to access the WSL by using the Windows Ip and port 22.

[source issue](https://github.com/quinnwencn/blog/issues/125)
