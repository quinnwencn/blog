---
title: "[BugRecord] When reparsing xxx, the basehash value changed from xxx to xxx...."
date: 2024-07-07 00:00:00
tags:
  - "Yocto"
categories:
  - "Embedded Linux"
---

<p>I built yocto project before, now I change some configuration and try to rebuild it by:
</p>
<p>``<code>bash
</p>
<p>bitbake recipename -c cleanall
</p>
<p>bitbake recipename -c cleansstate
</p>
<p>bitbake recipename
</p>
</code>``
<p>And the error occurs:
</p>
<img src="https://github.com/quinnwencn/blog/assets/143626366/3b5b9176-6585-4e87-a47f-1c6848213928" alt="image" style="max-width:100%;">
