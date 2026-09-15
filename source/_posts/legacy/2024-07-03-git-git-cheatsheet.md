---
title: "[git] git cheatsheet"
date: 2024-07-03 00:00:00
tags:
  - "git"
categories:
  - "Tooling"
---

<h2>git rebase
</h2>
<li>本地多分支
</li>
<p>git的提交记录如下：
</p>
<p>``<code>bash
</p>
<p>$ git show-ref --hash
</p>
<p>7e69dc25786dc0f8789801b7aa50c9f9d2e23708
</p>
<p>d457f84a3b3abbeaf6cbb60e605441842d4210f9
</p>
<p>6e011939cf74c6f24bff8bc1d301da9134716610
</p>
<p>4a14fa8f8aad3bc1a59905f290b0c479c5e30110
</p>
<p>9ab78ed1d846dd75dddb2ceb5a0bf54ed1fdca7b
</p>
<p>a5e2e43a9c4407600298b5f93900740247424b67
</p>
<p>a7c6904fb114d88ebd730dcfdf9d165beb61f998
</p>
</code>`<code>
<p>我们假设目前本地有多次提交，要提交到仓库时，不想暴露太多提交次数，可以将部分提交合并，我们假设a7最新的一次提交到远端仓库的hash，那么我们可以：
</p>
</code>`<code>bash
<p>git rebase -i a7c6904fb114d88ebd730dcfdf9d165beb61f998
</p>
</code>`<code>
<p>就会弹出窗口，我们可以选择一个提交记录(pick)，其他的删除
</p>
<h2>git 配置编辑器
</h2>
<p>在前面的git rebase命令执行时，会弹出编辑窗口，默认是nano，如果希望配置成熟悉的vim，可以这样配置：
</p>
</code>`<code>bash
<p>git config --global core.editor "vim"
</p>
</code>``
