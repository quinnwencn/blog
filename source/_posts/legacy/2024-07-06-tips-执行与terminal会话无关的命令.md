---
title: "[tips] 执行与terminal会话无关的命令"
date: 2024-07-06 00:00:00
tags:
  - "shell"
categories:
  - "Tooling"
---

<p>更确切的说是执行一个命令，即使shell会话退出后，这个命令仍然继续执行，这对于使用ssh连接远程机器工作的场景非常实用。
</p>
<h1>使用screen
</h1>
<li>创建screen会话
</li>
<p>``<code>bash
</p>
<p>screen -S session_name
</p>
</code>`<code>
<li>运行所需命令
</li>
</code>`<code>bash
<p>bibake package
</p>
</code>`<code>
<p> 3. 进入screen会话
</p>
 </code>`<code>bash
<p>Ctrl + A + D
</p>
</code>`<code>
<p>这样命令就仍然在后台运行。我们也可以通过screen显示当前的有效会话并进入会话：
</p>
</code>`<code>bash
<p>screen -ls # 显示有效会话
</p>
<p>screen -r session_name # 进入会话
</p>
</code>`<code>
<li>使用完毕后要删除会话
</li>
</code>`<code>bash
<p>screen -r session_name
</p>
<p>exit
</p>
</code>``
