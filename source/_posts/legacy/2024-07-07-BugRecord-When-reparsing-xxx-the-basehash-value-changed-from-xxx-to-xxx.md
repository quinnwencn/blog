---
title: "[BugRecord] When reparsing xxx, the basehash value changed from xxx to xxx...."
date: 2024-07-07 00:00:00
tags:
  - "Yocto"
categories:
  - "Embedded Linux"
---

I built yocto project before, now I change some configuration and try to rebuild it by:
```bash
bitbake recipename -c cleanall
bitbake recipename -c cleansstate
bitbake recipename
```
And the error occurs:
![image](https://github.com/quinnwencn/blog/assets/143626366/3b5b9176-6585-4e87-a47f-1c6848213928)

[source issue](https://github.com/quinnwencn/blog/issues/55)
