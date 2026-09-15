---
title: "[python] Install python3.9 on ubuntu16.04"
date: 2024-08-11 00:00:00
tags:
  - "python"
categories:
  - "Tooling"
---

1. 安装依赖
```bash
sudo apt install libffi-dev uuid-dev lzma-dev liblzma-dev libncurses5-dev libgdbm-dev sqlite3 libsqlite3-dev openssl tcl8.6-dev tk8.6-dev libreadline-dev zlib1g-dev build-essential
```
2. 从源码安装python3.9
2.1. 从[python官网](https://www.python.org/ftp/python/)下载python3.9 源码，我下载的是[python3.9.0的源码](https://www.python.org/ftp/python/3.9.0/Python-3.9.0.tgz)。
```bash
cd ~/work
wget https://www.python.org/ftp/python/3.9.0/Python-3.9.0.tgz
```

2.2. 解压源码
```bash
tar -xvf Python-3.9.0.tgz
```
2.3. 编译源码
```
cd Python-3.9.0
./configure prefix=/usr/local --enable-optimizations
```
2.4. 从源码编译安装
为了不覆盖原有python3的版本，我们的安装目录改为了/usr/local，同时需要使用altinstall，否则可能会因为覆盖了ubuntu16.04内置的python而导致系统无法启动
```bash
sudo make altinstall
```
 2.5. 验证版本
```bash
python3.9 --version
```
<img width="261" alt="image" src="https://github.com/user-attachments/assets/811b037a-302d-4133-99ff-8eff0f6ca2a8">

其他版本也可以参照步骤，下载不同版本的python源码安装即可。

[source issue](https://github.com/quinnwencn/blog/issues/65)
