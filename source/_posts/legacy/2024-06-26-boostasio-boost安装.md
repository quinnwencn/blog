---
title: "[boost.asio] boost安装"
date: 2024-06-26 00:00:00
tags:
  - "network programming"
categories:
  - "Tooling"
---

<h1>macos
</h1>
<p>macos上可以通过brew安装
</p>
<p>``<code>bash
</p>
<p>brew install boost
</p>
</code>`<code>
<p>如果没有安装brew，可以通过以下命令安装brew：
</p>
</code>`<code>bash
<p>/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
</p>
</code>`<code>
<h1>ubuntu
</h1>
<p>ubuntu安装可以先搜索可用的boost包：
</p>
</code>`<code>bash
<p>aptitude search boost
</p>
</code>`<code>
<p>如果对版本没有要求，可以直接安装搜索到的libboost-all-dev
</p>
</code>`<code>bash
<p>sudo apt install libboost-all-dev
</p>
</code>`<code>
<p>由于源的问题，一般不会存在最新版本，如果想要安装最新版本，可以通过源码安装，最新源码可以在<a href="https://www.boost.org/">boost 官网</a>或者<a href="https://sourceforge.net/projects/boost/files/boost/">sourceforge</a>找到，我这里通过boost官网下载：
</p>
</code>`<code>bash
<p>wget https://archives.boost.io/release/1.85.0/source/boost_1_85_0.tar.gz
</p>
</code>`<code>
<p>通过bootstrap设置安装前缀：
</p>
</code>`<code>bash
<p>./bootstrap.sh --prefix=/usr
</p>
</code>`<code>
<p>如果默认安装，则不需要添加</code>--prefix=/usr<code>，设置完后，会有一个b2的可执行文件，通过允许它编译boost：
</p>
</code>`<code>bash
<p>./b2
</p>
</code>`<code>
<p>编译完成后，还是通过b2安装，不过要加上sudo权限：
</p>
</code>`<code>bash
<p>sudo ./b2 install
</p>
</code>`<code>
<h1>测试使用
</h1>
</code>`<code>Cpp
<p>#include <boost/asio.hpp>
</p>
<p>#include <iostream>
</p>
<p>using namespace boost;
</p>
<p>int main()
</p>
<p>{
</p>
<p>	unsigned short port_num = 3333;
</p>
<p>	asio::ip::tcp::endpoint ep(asio::ip::address_v4::any(), port_num);
</p>
<p>	asio::io_service ios;
</p>
<p>	asio::ip::tcp::acceptor acceptor(ios, ep.protocol());
</p>
<p>	boost::system::error_code ec;
</p>
<p>	acceptor.bind(ep, ec);
</p>
<p>	if (ec.value() != 0) {
</p>
<p>		std::cout << "Failed to bind the acceptor socket."
</p>
<p>				  << " Error code = " << ec.value() << ". Message: "
</p>
<p>				  << ec.message();
</p>
<p>		return ec.value();
</p>
<p>	}
</p>
<p>	return 0;
</p>
<p>}
</p>
</code>``
