---
title: "[BugRecord] yocto编译报错Replace deprecated git branch parameter \"--set-upstream\" to \"--set-upstream-to\""
date: 2024-07-02 00:00:00
tags:
  - "Yocto"
categories:
  - "Embedded Linux"
---

在一个项目中，需要根据需求方提供的编译工具链和源码开发新功能，因此首先需要调通需求方提供的编译工具链。对方提供的编译工具链是基于yocto，但是在开始调试的过程中，遇到了一些问题：
1. `--set-upstream`
```
ERROR: PACKAGE do_unpack: Fetcher failure: ...;
git -c core.fsyncobjectfiles=0 branch --set-upstream master origin/master failed with exit code 128, output:
fatal: the '--set-upstream' option is no longer supported. Please use '--track' or '--set-upstream-to' instead.
```
这个问题是由于git的版本和yocto的版本不匹配，在yocto的FAQ中也有人提问：
https://wiki.dave.eu/index.php/Yocto_build_system_FAQs
![image](https://github.com/quinnwencn/blog/assets/143626366/c04c8508-5eeb-486d-8c1f-744f310ef237)
在NXP的论坛中给出了修改源码的解决办法：
https://docs.yoctoproject.org/pipermail/yocto/2017-October/038472.html
```
diff --git a/bitbake/lib/bb/fetch2/git.py b/bitbake/lib/bb/fetch2/git.py
index 2550bde838..7442f84414 100644
--- a/bitbake/lib/bb/fetch2/git.py
+++ b/bitbake/lib/bb/fetch2/git.py
@@ -326,7 +326,7 @@ class Git(FetchMethod):
                 branchname =  ud.branches[ud.names[0]]
                 runfetchcmd("%s checkout -B %s %s" % (ud.basecmd, branchname, \
                             ud.revisions[ud.names[0]]), d, workdir=destdir)
-                runfetchcmd("%s branch --set-upstream %s origin/%s" % (ud.basecmd, branchname, \
+                runfetchcmd("%s branch %s --set-upstream-to origin/%s" % (ud.basecmd, branchname, \
                             branchname), d, workdir=destdir)
             else:
                 runfetchcmd("%s checkout %s" % (ud.basecmd, ud.revisions[ud.names[0]]), d, workdir=destdir)
-- 
```
但是，需要注意，修改的时候，要注意并不只是把` --set-upstream`改为` --set-upstream-to`，还要将后面的origin的位置修改，否则会遇到这样的问题：
https://community.nxp.com/t5/i-MX-Processors/bitbake-fatal-branch-origin-master-does-not-exist/td-p/726844
2. m4-1.4.17编译出错
```
| ../../m4-1.4.17/lib/freadahead.c: In function ‘freadahead’:
| ../../m4-1.4.17/lib/freadahead.c:91:3: error: #error "Please port gnulib freadahead.c to your platform! Look at the definition of fflush, fread, ungetc on your system, then report this to bug-gnulib."
|    91 |  #error "Please port gnulib freadahead.c to your platform! Look at the definition of fflush, fread, ungetc on your system, then report this to bug-gnulib."
|       |   ^~~~~
| make[3]: *** [Makefile:1842: freadahead.o] Error 1
| make[3]: *** Waiting for unfinished jobs....
| ../../m4-1.4.17/lib/fseeko.c: In function ‘rpl_fseeko’:
| ../../m4-1.4.17/lib/fseeko.c:109:4: error: #error "Please port gnulib fseeko.c to your platform! Look at the code in fseeko.c, then report this to bug-gnulib."
|   109 |   #error "Please port gnulib fseeko.c to your platform! Look at the code in fseeko.c, then report this to bug-gnulib."
|       |    ^~~~~
| make[3]: *** [Makefile:1842: fseeko.o] Error 1
| make[3]: Leaving directory '/home/kane/work/yocto_wika/build-x11/tmp/work/x86_64-linux/m4-native/1.4.17-r0/build/lib'
| make[2]: *** [Makefile:1602: all] Error 2
| make[2]: Leaving directory '/home/kane/work/yocto_wika/build-x11/tmp/work/x86_64-linux/m4-native/1.4.17-r0/build/lib'
| make[1]: *** [Makefile:1506: all-recursive] Error 1
| make[1]: Leaving directory '/home/kane/work/yocto_wika/build-x11/tmp/work/x86_64-linux/m4-native/1.4.17-r0/build'
| make: *** [Makefile:1461: all] Error 2
| WARNING: exit code 1 from a shell command.
| ERROR: Function failed: do_compile (log file is located at /home/kane/work/yocto_wika/build-x11/tmp/work/x86_64-linux/m4-native/1.4.17-r0/temp/log.do_compile.61461)
ERROR: Task (/home/kane/work/yocto_wika/sources/poky/meta/recipes-devtools/m4/m4-native_1.4.17.bb:do_compile) failed with exit code '1'
```
解决方法：
更新补丁：https://github.com/orgs/Homebrew/discussions/263
但是，为了避免再遇到类似的问题，我装了ubuntu16.04，就可以一键编译了，因此还是编译环境不同导致的问题。

[source issue](https://github.com/quinnwencn/blog/issues/50)
