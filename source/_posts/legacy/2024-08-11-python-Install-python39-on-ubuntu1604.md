---
title: "[python] Install python3.9 on ubuntu16.04"
date: 2024-08-11 00:00:00
tags:
  - "python"
categories:
  - "Tooling"
---

<li>安装依赖
</li>
<p>``<code>bash
</p>
<p>sudo apt install libffi-dev uuid-dev lzma-dev liblzma-dev libncurses5-dev libgdbm-dev sqlite3 libsqlite3-dev openssl tcl8.6-dev tk8.6-dev libreadline-dev zlib1g-dev build-essential
</p>
</code>`<code>
<li>从源码安装python3.9
</li>
<p>2.1. 从<a href="https://www.python.org/ftp/python/">python官网</a>下载python3.9 源码，我下载的是<a href="https://www.python.org/ftp/python/3.9.0/Python-3.9.0.tgz">python3.9.0的源码</a>。
</p>
</code>`<code>bash
<p>cd ~/work
</p>
<p>wget https://www.python.org/ftp/python/3.9.0/Python-3.9.0.tgz
</p>
</code>`<code>
<p>2.2. 解压源码
</p>
</code>`<code>bash
<p>tar -xvf Python-3.9.0.tgz
</p>
</code>`<code>
<p>2.3. 编译源码
</p>
</code>`<code>
<p>cd Python-3.9.0
</p>
<p>./configure prefix=/usr/local --enable-optimizations
</p>
</code>`<code>
<p>2.4. 从源码编译安装
</p>
<p>为了不覆盖原有python3的版本，我们的安装目录改为了/usr/local，同时需要使用altinstall，否则可能会因为覆盖了ubuntu16.04内置的python而导致系统无法启动
</p>
</code>`<code>bash
<p>sudo make altinstall
</p>
</code>`<code>
<p> 2.5. 验证版本
</p>
</code>`<code>bash
<p>python3.9 --version
</p>
</code>``
<img width="261" alt="image" src="https://github.com/user-attachments/assets/811b037a-302d-4133-99ff-8eff0f6ca2a8">
<p>其他版本也可以参照步骤，下载不同版本的python源码安装即可。
</p>
