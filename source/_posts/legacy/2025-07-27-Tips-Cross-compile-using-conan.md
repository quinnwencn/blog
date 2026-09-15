---
title: "[Tips] Cross compile using conan"
date: 2025-07-27 00:00:00
tags:
  - "conan"
categories:
  - "Systems C++"
---

# 背景
我需要在一个第三方的Rootfs管理仓库中增加业务进程和依赖，但是项目方提供的rootfs是预编译的rootfs，即所有库文件和二进制已经预编译，不暴露任何源代码，也不提供其他编译系统（yocto, buildroot或者是openwrt）。项目方提供的docker image中的编译工具链也无法使用，项目方无意维护，也不愿意提供支持。在这个背景下，为了完成这个任务，只能自建编译环境，同时提供给其他人使用。

conan是一个开源的C/C++包管理器，可以很方便地解决C++工程中的依赖解决问题，并且可以通过定制不同的profile，实现交叉编译。但是，如果profile使用不当，也可能造成一些困惑。

# 问题
在制作交叉编译环境时，先生成了conan default profile，然后再将default profile改成了arm64位的profile，同时名字仍然保留为default，此时在交叉编译时，就出现了问题：
* CC 编译器编译后的程序无法运行
* boost的b2编译出现问题
* 其他编译器相关问题

# 问题原因和解决方法
## 问题原因
这些问题的出现是因为conan使用了host和build profile 两种profile，这两个profile的作用和使用如下：
* build：编译机器的profile，比如在这个问题场景中，编译平台是x64，因此就需要使用x64 profile，比如b2等编译工具的编译安装
* host：目标机器的profile，即编译后的产物要运行的平台，这里就是aarch64平台
conan默认的default profile一般就是build profile，即编译行为发生在当前运行的设备上。如果在default profile增加了交叉编译工具链设置，那么就会被conan 认为编译机器是aarch64 平台，因此就会出错，因为实际编译平台是x64的。

## 解决方案
根据conan的build profile和host profile的属性，新建一个aarch64 profile作为host profile，编译时指定profile为aarch64 profile即可，build profile会默认选用default profile.

# 编译环境Dockerfile
```Dockerfile
FROM ubuntu:24.04

ENV DEBIAN_FRONTEND=noninteractive

SHELL ["/bin/bash" , "-c"]

RUN apt-get update && apt-get -y install \
 autoconf \
 asn1c \
 automake \
 cmake \
 curl \
 git \
 make \
 ninja-build \
 pipx \
 wget \
 tar \
 xz-utils \
 sed \
 flex \
 bison \
 pkg-config

RUN pipx install conan
ENV PATH="/root/.local/bin:/root/.local/share/pipx/venvs/conan/bin:${PATH}"

RUN useradd builder

WORKDIR /home/builder

ARG TOOLCHAIN_URL=https://developer.arm.com/-/media/Files/downloads/gnu/11.3.rel1/binrel/arm-gnu-toolchain-11.3.rel1-x86_64-aarch64-none-linux-gnu.tar.xz
ARG TARGET_PATH=/opt/cross_compile

RUN mkdir -p $TARGET_PATH
RUN wget $TOOLCHAIN_URL && tar -xvf arm-gnu-toolchain-11.3.rel1-x86_64-aarch64-none-linux-gnu.tar.xz --directory $TARGET_PATH
RUN rm arm-gnu-toolchain-11.3.rel1-x86_64-aarch64-none-linux-gnu.tar.xz

RUN . ~/.bashrc
RUN conan profile detect

ARG CONAN_PROFILE_PATH=/root/.conan2/profiles
ARG AARCH64_PROFILE=$CONAN_PROFILE_PATH/aarch64
RUN cp $CONAN_PROFILE_PATH/default $AARCH64_PROFILE
RUN sed -i 's/x86_64/armv8/g' $AARCH64_PROFILE 
RUN sed -i 's/version=13/version=11/g' $AARCH64_PROFILE 

RUN echo [conf] >> $AARCH64_PROFILE 
RUN echo tools.gnu:host_triplet=aarch64-linux-gnu >> $AARCH64_PROFILE 

RUN echo [buildenv] >> $AARCH64_PROFILE 
RUN echo CC=$TARGET_PATH/arm-gnu-toolchain-11.3.rel1-x86_64-aarch64-none-linux-gnu/bin/aarch64-none-linux-gnu-gcc >> $AARCH64_PROFILE 
RUN echo CXX=$TARGET_PATH/arm-gnu-toolchain-11.3.rel1-x86_64-aarch64-none-linux-gnu/bin/aarch64-none-linux-gnu-g++ >> $AARCH64_PROFILE 
RUN echo LD=$TARGET_PATH/arm-gnu-toolchain-11.3.rel1-x86_64-aarch64-none-linux-gnu/bin/aarch64-none-linux-gnu-ld >> $AARCH64_PROFILE 

```

[source issue](https://github.com/quinnwencn/blog/issues/119)
