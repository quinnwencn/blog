---
title: "[yocto] Add security flags to your target"
date: 2024-07-11 00:00:00
tags:
  - "Yocto"
categories:
  - "Embedded Linux"
---

安全已经是一个日益重要的话题了，在嵌入式领域也是如此。在CTF比赛中，PWN类型的题目更是利用了多种漏洞实现攻击的目的。因此，在软件的编译过程中，为软件添加一些安全编译选项可以加强软件的安全性。常见的安全编译选项有：
* Canary： 用于防止栈溢出，-fstack-protector-strong/all
* NX： 栈不可执行 -Wl,-z noexecstack
* RELRO： 立即绑定/延时绑定，对GOT表的保护, -Wl,-z,now
* FORTIFY：字符串相关, -D_FORTIFY_SOURCE
* PIE：地址随机化， -fPIE -pie
* PIC：地址无关 -fPIC
Yocto也提供了相应的编译保护措施，只是并不是默认开启，这里也提供了指导：[Making Images More Secure](https://docs.yoctoproject.org/dev/dev-manual/securing-images.html#making-images-more-secure)。但是，我在我的项目中在Machine的配置文件中添加并不成功，而需要在meta-layer下的conf/layers.bb文件中添加才行：
```

BBFILE_COLLECTIONS += "xxx"
BBFILE_PATTERN_xxx = "^${LAYERDIR}/"
BBFILE_PRIORITY_xxx = "11"

include conf/distro/include/security_flags.inc

IMAGE_CLASSES += "image_types_xxx"
IMAGE_OVERHEAD_FACTOR = "1.2"
```
其中，有一些package是自定义的编译方法，无法通过这种方式实现，只能单独添加：
xxx.bb:
```
xxx
do_compile() {
	${CC} -Wall md5.c fwunpack.c -o fwunpack
}
xxx
```
这种只能手动添加：
```
xxx
do_compile() {
	${CC} -Wall md5.c fwunpack.c -fstack-protector-strong -Wl -z now  -o fwunpack
}
xxx
```

[source issue](https://github.com/quinnwencn/blog/issues/57)
