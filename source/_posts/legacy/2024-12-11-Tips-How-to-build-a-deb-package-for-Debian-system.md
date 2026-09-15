---
title: "[Tips] How to build a deb package for Debian system"
date: 2024-12-11 00:00:00
tags:
  - "Linux"
  - "Ubuntu"
categories:
  - "Embedded Linux"
---

It is common to release a package or tool for team members or others. Sometimes we directly release the source code of the tool, and in some cases, we don't want to expose our source code, we can only give them an ELF binary. But ELF files usually don't work in other machines though it works well on our PC.  So we need a way to release our tools or software.
On Debian system, for example Ubuntu, we can release our software as a package, and other users can install them from `apt install` command.
# Package Structure
Here is the directory architecture of a software to be packed as a deb binary:
```bash
pack
├── DEBIAN
│   └── control
├── etc
│   └── fota
│       └── config.toml
└── usr
    ├── bin
    │   ├── fota-upload
    │   └── garage-push
    └── lib
        └── libsota_tools.so
```
The `DEBIAN` directory is a directory contains files tell `dpkg` how to pack this files; other files are the destination of the installed software. For example, we want to add a config file `config.toml` to the system after the software installed, we need to add a directory `etc` in the pack directory, and place the configure file in to it.
Let's now focus on `DEBIAN` again.

[source issue](https://github.com/quinnwencn/blog/issues/82)
