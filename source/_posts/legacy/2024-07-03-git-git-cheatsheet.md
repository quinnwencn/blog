---
title: "[git] git cheatsheet"
date: 2024-07-03 00:00:00
tags:
  - "git"
categories:
  - "Tooling"
---

## git rebase
1. 本地多分支
git的提交记录如下：
```bash
$ git show-ref --hash
7e69dc25786dc0f8789801b7aa50c9f9d2e23708
d457f84a3b3abbeaf6cbb60e605441842d4210f9
6e011939cf74c6f24bff8bc1d301da9134716610
4a14fa8f8aad3bc1a59905f290b0c479c5e30110
9ab78ed1d846dd75dddb2ceb5a0bf54ed1fdca7b
a5e2e43a9c4407600298b5f93900740247424b67
a7c6904fb114d88ebd730dcfdf9d165beb61f998
```
我们假设目前本地有多次提交，要提交到仓库时，不想暴露太多提交次数，可以将部分提交合并，我们假设a7最新的一次提交到远端仓库的hash，那么我们可以：
```bash
git rebase -i a7c6904fb114d88ebd730dcfdf9d165beb61f998
```
就会弹出窗口，我们可以选择一个提交记录(pick)，其他的删除
## git 配置编辑器
在前面的git rebase命令执行时，会弹出编辑窗口，默认是nano，如果希望配置成熟悉的vim，可以这样配置：
```bash
git config --global core.editor "vim"
```

[source issue](https://github.com/quinnwencn/blog/issues/51)
