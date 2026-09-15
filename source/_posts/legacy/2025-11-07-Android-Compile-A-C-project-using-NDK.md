---
title: "[Android] Compile A C++ project using NDK"
date: 2025-11-07 00:00:00
tags:
  - "Android"
categories:
  - "Systems C++"
---

Though you are not an Android developer, you might need to build a so or executable for the Android platform. This tutorial will teach you how to set up the NDK environment and build a C++ project using NDK (Android Development Kit).

# Install NDK
Download the NDK from [NDK Downloads](https://developer.android.com/ndk/downloads?hl=en) and then unzip it to your preferred directory:
```
cd ~/bin
wget https://developer.android.com/ndk/downloads?hl=en#:~:text=android%2D-,ndk,-%2Dr27d%2Dlinux.zip
unzip android-ndk-r27d-linux.zip
```
Add the path of NDK to your environment:
```
vim ~/.zshrc
# append the following context to the end of the file
export NDK_HOME=/home/yourname/bin/android-ndk-r27d
export PATH=$NDK_HOME:$PATH
```
Run `ndk-build --verison` to verify that the NDK environment is setup good. The output should be as the same as following:
```
$ ndk-build --version
GNU Make 4.3
Built for x86_64-pc-linux-gnu
Copyright (C) 1988-2020 Free Software Foundation, Inc.
License GPLv3+: GNU GPL version 3 or later <http://gnu.org/licenses/gpl.html>
This is free software: you are free to change and redistribute it.
There is NO WARRANTY, to the extent permitted by law.
```

# Test NDK with an example
Write a simple program to verify that the ndk works well:
C++ source code: 
```Cpp
#include <iostream>

using namespace std;

int main(int argc, char** argv) {
    cout << "hello, world!" << endl;
    return 0;
}
```

CMakeLists.txt source code: 
```CMake
cmake_minimum_required(VERSION 3.20)

project(ndk_test)

add_executable(${PROJECT_NAME} hello.cpp)
```

And build it using android toolchain:
```bash
cmake  -Bbuild -DCMAKE_TOOLCHAIN_FILE=$NDK_HOME/build/cmake/android.toolchain.cmake -DANDROID_NDK=$NDK_HOME -DANDROID_ABI=armeabi-v7a -DANDROID_NATIVE_API_LEVEL=27

cmake --build build
```

# Build `Aktualizr` using NDK
`Aktualizr` is an open source OTA solution written in C++.  Now I will use the same way to compile it and fix the bugs during the compilation.

## Boost not found
NDK has no Boost support by default, which is a dependency of `Aktualizr`. Therefore, this error will occur when compiling `Aktualizr`.
```
cmake -DCMAKE_TOOLCHAIN=/$NDK_HOME/build/cmake/android.toolchain.cmake -DANDROID_NDK=$NDK_HOME -DANDROID=armeabi-v7a -DANDROID_PLATFORM=android-27 -Bbuild
-- The C compiler identification is GNU 13.3.0
-- The CXX compiler identification is GNU 13.3.0
-- Detecting C compiler ABI info
-- Detecting C compiler ABI info - done
-- Check for working C compiler: /usr/bin/cc - skipped
-- Detecting C compile features
-- Detecting C compile features - done
-- Detecting CXX compiler ABI info
-- Detecting CXX compiler ABI info - done
-- Check for working CXX compiler: /usr/bin/c++ - skipped
-- Detecting CXX compile features
-- Detecting CXX compile features - done
-- No CMAKE_BUILD_TYPE specified, defaulting to Release
CMake Error at /usr/share/cmake-3.28/Modules/FindPackageHandleStandardArgs.cmake:230 (message):
  Could NOT find Boost (missing: Boost_INCLUDE_DIR log_setup log system
  filesystem program_options) (Required is at least version "1.58.0")
Call Stack (most recent call first):
  /usr/share/cmake-3.28/Modules/FindPackageHandleStandardArgs.cmake:600 (_FPHSA_FAILURE_MESSAGE)
  /usr/share/cmake-3.28/Modules/FindBoost.cmake:2393 (find_package_handle_standard_args)
  CMakeLists.txt:81 (find_package)


-- Configuring incomplete, errors occurred!
```
To fix this problem, we need to rebuilt the [boost-for-android](https://github.com/moritz-wundke/Boost-for-Android) using the following command:
```bash
 ./build-android.sh \
  --arch=arm64-v8a \
  --boost=1.82.0 \
  --target-version=27 \
  --layout=system \
  --with-libraries=log,filesystem,system,program_options \
  $NDK_HOME
```
`--layout=system` to remove the compiler and threads suffix info in the output library. And then rebuild `aktualizr` to recompile:
```bash
cmake -DBoost_NO_SYSTEM_PATHS=TRUE \
        -DCMAKE_TOOLCHAIN_FILE=$NDK_HOME//build/cmake/android.toolchain.cmake \
        -DBOOST_ROOT=/home/yourname/work/workaround/deps/Boost-for-Android/build/out/arm64-v8a/ \
        -DBoost_INCLUDE_DIR=${BOOST_ROOT}/include \
        -DBoost_LIBRARY_DIR=${BOOST_ROOT}/lib \
        -DBoost_ADDITIONAL_VERSIONS="1.82" \
        -DBoost_COMPILER:STRING=-clang \
        -DBoost_USE_MULTITHREADED=ON \
        -Bbuild
```

[source issue](https://github.com/quinnwencn/blog/issues/126)
