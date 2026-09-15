---
title: "[tips] 执行与terminal会话无关的命令"
date: 2024-07-06 00:00:00
tags:
  - "shell"
categories:
  - "Tooling"
---

更确切的说是执行一个命令，即使shell会话退出后，这个命令仍然继续执行，这对于使用ssh连接远程机器工作的场景非常实用。
# 使用screen
1. 创建screen会话
```bash
screen -S session_name
```
2. 运行所需命令
```bash
bibake package
```
 3. 进入screen会话
 ```bash
Ctrl + A + D
```
这样命令就仍然在后台运行。我们也可以通过screen显示当前的有效会话并进入会话：
```bash
screen -ls # 显示有效会话
screen -r session_name # 进入会话
```
4. 使用完毕后要删除会话
```bash
screen -r session_name
exit
```

[source issue](https://github.com/quinnwencn/blog/issues/54)
