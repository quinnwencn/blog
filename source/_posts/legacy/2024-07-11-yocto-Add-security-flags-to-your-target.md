---
title: "[yocto] Add security flags to your target"
date: 2024-07-11 00:00:00
tags:
  - "Yocto"
categories:
  - "Embedded Linux"
---

<p>安全已经是一个日益重要的话题了，在嵌入式领域也是如此。在CTF比赛中，PWN类型的题目更是利用了多种漏洞实现攻击的目的。因此，在软件的编译过程中，为软件添加一些安全编译选项可以加强软件的安全性。常见的安全编译选项有：
</p>
<p>* Canary： 用于防止栈溢出，-fstack-protector-strong/all
</p>
<p>* NX： 栈不可执行 -Wl,-z noexecstack
</p>
<p>* RELRO： 立即绑定/延时绑定，对GOT表的保护, -Wl,-z,now
</p>
<p>* FORTIFY：字符串相关, -D_FORTIFY_SOURCE
</p>
<p>* PIE：地址随机化， -fPIE -pie
</p>
<p>* PIC：地址无关 -fPIC
</p>
<p>Yocto也提供了相应的编译保护措施，只是并不是默认开启，这里也提供了指导：<a href="https://docs.yoctoproject.org/dev/dev-manual/securing-images.html#making-images-more-secure">Making Images More Secure</a>。但是，我在我的项目中在Machine的配置文件中添加并不成功，而需要在meta-layer下的conf/layers.bb文件中添加才行：
</p>
<p>``<code>
</p>
<p>BBFILE_COLLECTIONS += "xxx"
</p>
<p>BBFILE_PATTERN_xxx = "^${LAYERDIR}/"
</p>
<p>BBFILE_PRIORITY_xxx = "11"
</p>
<p>include conf/distro/include/security_flags.inc
</p>
<p>IMAGE_CLASSES += "image_types_xxx"
</p>
<p>IMAGE_OVERHEAD_FACTOR = "1.2"
</p>
</code>`<code>
<p>其中，有一些package是自定义的编译方法，无法通过这种方式实现，只能单独添加：
</p>
<p>xxx.bb:
</p>
</code>`<code>
<p>xxx
</p>
<p>do_compile() {
</p>
<p>	${CC} -Wall md5.c fwunpack.c -o fwunpack
</p>
<p>}
</p>
<p>xxx
</p>
</code>`<code>
<p>这种只能手动添加：
</p>
</code>`<code>
<p>xxx
</p>
<p>do_compile() {
</p>
<p>	${CC} -Wall md5.c fwunpack.c -fstack-protector-strong -Wl -z now  -o fwunpack
</p>
<p>}
</p>
<p>xxx
</p>
</code>``
