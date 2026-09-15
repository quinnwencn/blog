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

在Yocto的recipe中，有些包是有子仓库的，如果子仓库的链接有效，那么正常编译不会遇到问题。但是，由于NXP废弃掉了freescale相关的仓库，因此如果你的包有用到Freescale的链接，都会因为无法fetch而失败。例如：
![image](https://github.com/user-attachments/assets/ce41b3f7-7687-45bd-b335-72efb263c58a)
如果获取不到的包是有bb文件描述，那么直接替换掉bb文件里的仓库链接即可。但是，如果无法fetch的是某个bb文件描述的包的子仓库，那么就无法通过bb文件的修改达到目的，因为子仓库的URL并不会体现在bb文件中，而是体现在git仓库中的.gitmodule中。
## git submodule
git子仓库是一个git仓库，引用另一个仓库的代码作为模块的一部分。在git仓库中，替换子仓库的操作是：
1. 替换.gitmodule中子仓库的url：
```
-rw-r--r--   1 kanewen  staff   384B Jul 13 23:30 MAINTAINERS
diff --git a/.gitmodules b/.gitmodules
index 1e46cf5ea..f2c382065 100644
--- a/.gitmodules
+++ b/.gitmodules
@@ -1,3 +1,3 @@
 [submodule "common"]
         path = common
-        url = https://anongit.freedesktop.org/git/gstreamer/common.git
+        url = https://github.com/GStreamer/common.git
```
但是，只替换.gitmodule中url并不会起作用，此时如果执行`git submodule update`，仍然会采用之前的url去拉去代码。
这一点，我们可以查看`.git/config`验证：
```
# cat .git/config
[core]
	repositoryformatversion = 0
	filemode = true
	bare = false
	logallrefupdates = true
	ignorecase = true
	precomposeunicode = true
[remote "origin"]
	url = https://github.com/nxp-imx/gst-plugins-bad.git
	fetch = +refs/heads/*:refs/remotes/origin/*
[branch "MM_04.08.03_2312_L6.6.y"]
	remote = origin
	merge = refs/heads/MM_04.08.03_2312_L6.6.y
[branch "1.12.0"]
	remote = origin
	merge = refs/heads/freedesktop.org/1.12
[submodule "common"]
	active = true
	url = https://anongit.freedesktop.org/git/gstreamer/common.git
```
2. 同步.gitmodule的修改到.git/config
```
git submodule sync

cat  .git/config
[core]
	repositoryformatversion = 0
	filemode = true
	bare = false
	logallrefupdates = true
	ignorecase = true
	precomposeunicode = true
[remote "origin"]
	url = https://github.com/nxp-imx/gst-plugins-bad.git
	fetch = +refs/heads/*:refs/remotes/origin/*
[branch "MM_04.08.03_2312_L6.6.y"]
	remote = origin
	merge = refs/heads/MM_04.08.03_2312_L6.6.y
[branch "1.12.0"]
	remote = origin
	merge = refs/heads/freedesktop.org/1.12
[submodule "common"]
	active = true
	url = https://github.com/GStreamer/common.git
```
此时再去执行`git submodule sync`就会顺利拉去代码了。
## yocto中的修改
但是，在Yocto中如何实现呢？修改.gitmodule的操作可以通过补丁的方式实现：
``` 0004-common-url.patch
diff --git a/.gitmodules b/.gitmodules
index 1e46cf5ea..3d753b9f0 100644
--- a/.gitmodules
+++ b/.gitmodules
@@ -1,3 +1,3 @@
 [submodule "common"]
         path = common
-        url = https://anongit.freedesktop.org/git/gstreamer/common.git
+        url = https://github.com/GStreamer/common.git
```
如果此时通过bitbake去编译这个包，同样会使用之前的url去fetch，因此同样会失败，我们还需要将git submodule sync这个命令在拉去子仓库前执行：
尝试了多次后，没找到解决方法，这里暂记一个TODO。

## 通过git仓库解决问题
这里我通过fork恩智浦的仓库的方式，修改了子仓库的链接，同时修改hash值为自己提交的hash。详情参见：
https://github.com/quinnwencn/gst-plugins-bad

[source issue](https://github.com/quinnwencn/blog/issues/58)
