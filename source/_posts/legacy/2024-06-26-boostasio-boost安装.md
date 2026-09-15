---
title: "[boost.asio] boost安装"
date: 2024-06-26 00:00:00
tags:
  - "network programming"
categories:
  - "Tooling"
---

# macos
macos上可以通过brew安装
```bash
brew install boost
```
如果没有安装brew，可以通过以下命令安装brew：
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```
# ubuntu
ubuntu安装可以先搜索可用的boost包：
```bash
aptitude search boost
```
如果对版本没有要求，可以直接安装搜索到的libboost-all-dev
```bash
sudo apt install libboost-all-dev
```
由于源的问题，一般不会存在最新版本，如果想要安装最新版本，可以通过源码安装，最新源码可以在[boost 官网](https://www.boost.org/)或者[sourceforge](https://sourceforge.net/projects/boost/files/boost/)找到，我这里通过boost官网下载：
```bash
wget https://archives.boost.io/release/1.85.0/source/boost_1_85_0.tar.gz
```
通过bootstrap设置安装前缀：
```bash
./bootstrap.sh --prefix=/usr
```
如果默认安装，则不需要添加`--prefix=/usr`，设置完后，会有一个b2的可执行文件，通过允许它编译boost：
```bash
./b2
```
编译完成后，还是通过b2安装，不过要加上sudo权限：
```bash
sudo ./b2 install
```
# 测试使用
```Cpp
#include <boost/asio.hpp>
#include <iostream>

using namespace boost;

int main()
{
	unsigned short port_num = 3333;
	asio::ip::tcp::endpoint ep(asio::ip::address_v4::any(), port_num);
	asio::io_service ios;
	asio::ip::tcp::acceptor acceptor(ios, ep.protocol());
	boost::system::error_code ec;
	acceptor.bind(ep, ec);

	if (ec.value() != 0) {
		std::cout << "Failed to bind the acceptor socket."
				  << " Error code = " << ec.value() << ". Message: "
				  << ec.message();
		return ec.value();
	}

	return 0;
}
```

[source issue](https://github.com/quinnwencn/blog/issues/48)
