---
title: "[WSL] enable ssh access from another PC on WSL"
date: 2025-11-07 00:00:00
tags:
  - "WSL"
categories:
  - "Systems C++"
---

<p>Since WSL does not have an independent network interface exported on the local network, other PCs can't access it. But we can use host windows to redirect ssh port to WSL.</p>
<h1>Command</h1>
<p>On the host Windows system, open a shell using the administrator role, and execute the following command:</p>
<p>``<code>sh</p>
<p>netsh interface portproxy add v4tov4 listenport=[windows port] listenaddress=0.0.0.0 connectport=[wsl port] connectaddress=[wsl address]</p>
</code>``
<p>After the command is executed, any PC from the same local address should be able to access the WSL by using the Windows Ip and port 22. </p>
