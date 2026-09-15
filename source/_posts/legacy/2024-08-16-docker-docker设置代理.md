---
title: "[docker] docker设置代理"
date: 2024-08-16 00:00:00
tags:
  - "Docker"
categories:
  - "Embedded Linux"
---

<p>处于某些原因，docker镜像的拉取必须有代理才能完成，但是docker的代理和terminal的代理不同，只设置terminal代理，无法访问docker hub。要想成功访问docker hub，必须单独为docker设置代理，也就是为docker daemon设置代理：
</p>
<li>创建docker daemon配置文件
</li>
<p>``<code>bash
</p>
<p>sudo mkdir -p /etc/systemd/system/docker.service.d
</p>
<p>sudo touch /etc/systemd/system/docker.service.d/proxy.conf
</p>
</code>`<code>
<li>设置代理
</li>
</code>`<code>bash
<p>[Service]
</p>
<p>Environment="HTTP_PROXY=http://proxy.example.com:8080/"
</p>
<p>Environment="HTTPS_PROXY=http://proxy.example.com:8080/"
</p>
<p>Environment="NO_PROXY=localhost,127.0.0.1,.example.com"
</p>
</code>`<code>
<p>其中，HTTP_PROXY和HTTPS_PROXY的proxy.example.com应该为代理的ip，如果是本机自己的代理，则改为</code>127.0.0.1<code>，如果是其他代理，则改为对应代理的ip，并修改对应代理的端口。
</p>
<li>容器内部代理
</li>
<p>如果容器内部需要代理，比如说容器内需要拉取github仓库等， 那么还需要额外配置容器代理：
</p>
</code>`<code>bash
<p>$ cat ~/.docker/config.json                                               1 ↵
</p>
<p>{
</p>
<p> "proxies":
</p>
<p> {
</p>
<p>   "default":
</p>
<p>   {
</p>
<p>     "httpProxy": "http://proxy.example.com:8080",
</p>
<p>     "httpsProxy": "http:// proxy.example.com:8080",
</p>
<p>     "noProxy": "localhost,127.0.0.1,.example.com"
</p>
<p>   }
</p>
<p> }
</p>
<p>}
</p>
</code>`<code>
<li>检查是否生效
</li>
</code>`<code>bash
<p>sudo systemctl show --property=Environment docker
</p>
</code>`<code>
<li>如果未生效，那么就需要重启docker服务
</li>
</code>`<code>bash
<p>sudo systemctl daemon-reload
</p>
<p>sudo systemctl restart docker
</p>
</code>``
