---
title: "[Yocto] update submodule url of package"
date: 2024-07-13 00:00:00
tags:
  - "git"
  - "Yocto"
  - "git submodule"
categories:
  - "Embedded Linux"
---

<p>在Yocto的recipe中，有些包是有子仓库的，如果子仓库的链接有效，那么正常编译不会遇到问题。但是，由于NXP废弃掉了freescale相关的仓库，因此如果你的包有用到Freescale的链接，都会因为无法fetch而失败。例如：
</p>
<img src="https://github.com/user-attachments/assets/ce41b3f7-7687-45bd-b335-72efb263c58a" alt="image" style="max-width:100%;">
<p>如果获取不到的包是有bb文件描述，那么直接替换掉bb文件里的仓库链接即可。但是，如果无法fetch的是某个bb文件描述的包的子仓库，那么就无法通过bb文件的修改达到目的，因为子仓库的URL并不会体现在bb文件中，而是体现在git仓库中的.gitmodule中。
</p>
<h2>git submodule
</h2>
<p>git子仓库是一个git仓库，引用另一个仓库的代码作为模块的一部分。在git仓库中，替换子仓库的操作是：
</p>
<li>替换.gitmodule中子仓库的url：
</li>
<p>``<code>
</p>
<p>-rw-r--r--   1 kanewen  staff   384B Jul 13 23:30 MAINTAINERS
</p>
<p>diff --git a/.gitmodules b/.gitmodules
</p>
<p>index 1e46cf5ea..f2c382065 100644
</p>
<p>--- a/.gitmodules
</p>
<p>+++ b/.gitmodules
</p>
<p>@@ -1,3 +1,3 @@
</p>
<p> [submodule "common"]
</p>
<p>         path = common
</p>
<li>       url = https://anongit.freedesktop.org/git/gstreamer/common.git
</li>
<p>+        url = https://github.com/GStreamer/common.git
</p>
</code>`<code>
<p>但是，只替换.gitmodule中url并不会起作用，此时如果执行</code>git submodule update<code>，仍然会采用之前的url去拉去代码。
</p>
<p>这一点，我们可以查看</code>.git/config<code>验证：
</p>
</code>`<code>
<h1>cat .git/config
</h1>
<p>[core]
</p>
<p>	repositoryformatversion = 0
</p>
<p>	filemode = true
</p>
<p>	bare = false
</p>
<p>	logallrefupdates = true
</p>
<p>	ignorecase = true
</p>
<p>	precomposeunicode = true
</p>
<p>[remote "origin"]
</p>
<p>	url = https://github.com/nxp-imx/gst-plugins-bad.git
</p>
<p>	fetch = +refs/heads/<em>:refs/remotes/origin/</em>
</p>
<p>[branch "MM_04.08.03_2312_L6.6.y"]
</p>
<p>	remote = origin
</p>
<p>	merge = refs/heads/MM_04.08.03_2312_L6.6.y
</p>
<p>[branch "1.12.0"]
</p>
<p>	remote = origin
</p>
<p>	merge = refs/heads/freedesktop.org/1.12
</p>
<p>[submodule "common"]
</p>
<p>	active = true
</p>
<p>	url = https://anongit.freedesktop.org/git/gstreamer/common.git
</p>
</code>`<code>
<li>同步.gitmodule的修改到.git/config
</li>
</code>`<code>
<p>git submodule sync
</p>
<p>cat  .git/config
</p>
<p>[core]
</p>
<p>	repositoryformatversion = 0
</p>
<p>	filemode = true
</p>
<p>	bare = false
</p>
<p>	logallrefupdates = true
</p>
<p>	ignorecase = true
</p>
<p>	precomposeunicode = true
</p>
<p>[remote "origin"]
</p>
<p>	url = https://github.com/nxp-imx/gst-plugins-bad.git
</p>
<p>	fetch = +refs/heads/<em>:refs/remotes/origin/</em>
</p>
<p>[branch "MM_04.08.03_2312_L6.6.y"]
</p>
<p>	remote = origin
</p>
<p>	merge = refs/heads/MM_04.08.03_2312_L6.6.y
</p>
<p>[branch "1.12.0"]
</p>
<p>	remote = origin
</p>
<p>	merge = refs/heads/freedesktop.org/1.12
</p>
<p>[submodule "common"]
</p>
<p>	active = true
</p>
<p>	url = https://github.com/GStreamer/common.git
</p>
</code>`<code>
<p>此时再去执行</code>git submodule sync<code>就会顺利拉去代码了。
</p>
<h2>yocto中的修改
</h2>
<p>但是，在Yocto中如何实现呢？修改.gitmodule的操作可以通过补丁的方式实现：
</p>
</code>`<code> 0004-common-url.patch
<p>diff --git a/.gitmodules b/.gitmodules
</p>
<p>index 1e46cf5ea..3d753b9f0 100644
</p>
<p>--- a/.gitmodules
</p>
<p>+++ b/.gitmodules
</p>
<p>@@ -1,3 +1,3 @@
</p>
<p> [submodule "common"]
</p>
<p>         path = common
</p>
<li>       url = https://anongit.freedesktop.org/git/gstreamer/common.git
</li>
<p>+        url = https://github.com/GStreamer/common.git
</p>
</code>``
<p>如果此时通过bitbake去编译这个包，同样会使用之前的url去fetch，因此同样会失败，我们还需要将git submodule sync这个命令在拉去子仓库前执行：
</p>
<p>尝试了多次后，没找到解决方法，这里暂记一个TODO。
</p>
<h2>通过git仓库解决问题
</h2>
<p>这里我通过fork恩智浦的仓库的方式，修改了子仓库的链接，同时修改hash值为自己提交的hash。详情参见：
</p>
<p>https://github.com/quinnwencn/gst-plugins-bad</p>
