---
title: "[Ubuntu] Create a deb package in Ubuntu"
date: 2025-12-03 00:00:00
tags:
  - "legacy"
categories:
  - "Tooling"
---

<p>有这样一个场景，我们开发的工具，需要发布给其他人使用，但是又不需要暴露源码，就只剩下二进制交付的形式了。二进制交付的形式可以是打包一个Docker Image交付，也可以直接交付安装包。以Docker Image形式交付一个工具，有点拿大箱子装回形针的感觉，因此我们选择安装包形式。</p>
