---
title: "[Tips] How to build a deb package for Debian system"
date: 2024-12-11 00:00:00
tags:
  - "Linux"
  - "Ubuntu"
categories:
  - "Embedded Linux"
---

<p>It is common to release a package or tool for team members or others. Sometimes we directly release the source code of the tool, and in some cases, we don't want to expose our source code, we can only give them an ELF binary. But ELF files usually don't work in other machines though it works well on our PC.  So we need a way to release our tools or software.
</p>
<p>On Debian system, for example Ubuntu, we can release our software as a package, and other users can install them from <code>apt install</code> command.
</p>
<h1>Package Structure
</h1>
<p>Here is the directory architecture of a software to be packed as a deb binary:
</p>
<p>``<code>bash
</p>
<p>pack
</p>
<p>├── DEBIAN
</p>
<p>│   └── control
</p>
<p>├── etc
</p>
<p>│   └── fota
</p>
<p>│       └── config.toml
</p>
<p>└── usr
</p>
<p>    ├── bin
</p>
<p>    │   ├── fota-upload
</p>
<p>    │   └── garage-push
</p>
<p>    └── lib
</p>
<p>        └── libsota_tools.so
</p>
</code>`<code>
<p>The </code>DEBIAN<code> directory is a directory contains files tell </code>dpkg<code> how to pack this files; other files are the destination of the installed software. For example, we want to add a config file </code>config.toml<code> to the system after the software installed, we need to add a directory </code>etc<code> in the pack directory, and place the configure file in to it.
</p>
<p>Let's now focus on </code>DEBIAN` again. </p>
