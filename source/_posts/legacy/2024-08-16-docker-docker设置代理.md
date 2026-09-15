---
title: "[docker] docker设置代理"
date: 2024-08-16 00:00:00
tags:
  - "Docker"
categories:
  - "Embedded Linux"
---

处于某些原因，docker镜像的拉取必须有代理才能完成，但是docker的代理和terminal的代理不同，只设置terminal代理，无法访问docker hub。要想成功访问docker hub，必须单独为docker设置代理，也就是为docker daemon设置代理：
1. 创建docker daemon配置文件
```bash
sudo mkdir -p /etc/systemd/system/docker.service.d
sudo touch /etc/systemd/system/docker.service.d/proxy.conf
```
2. 设置代理
```bash
[Service]
Environment="HTTP_PROXY=http://proxy.example.com:8080/"
Environment="HTTPS_PROXY=http://proxy.example.com:8080/"
Environment="NO_PROXY=localhost,127.0.0.1,.example.com"
```
其中，HTTP_PROXY和HTTPS_PROXY的proxy.example.com应该为代理的ip，如果是本机自己的代理，则改为`127.0.0.1`，如果是其他代理，则改为对应代理的ip，并修改对应代理的端口。
3. 容器内部代理
如果容器内部需要代理，比如说容器内需要拉取github仓库等， 那么还需要额外配置容器代理：
```bash
$ cat ~/.docker/config.json                                               1 ↵
{
 "proxies":
 {
   "default":
   {
     "httpProxy": "http://proxy.example.com:8080",
     "httpsProxy": "http:// proxy.example.com:8080",
     "noProxy": "localhost,127.0.0.1,.example.com"
   }
 }
}
```
4. 检查是否生效
```bash
sudo systemctl show --property=Environment docker
```
5. 如果未生效，那么就需要重启docker服务
```bash
sudo systemctl daemon-reload
sudo systemctl restart docker
```

[source issue](https://github.com/quinnwencn/blog/issues/66)
