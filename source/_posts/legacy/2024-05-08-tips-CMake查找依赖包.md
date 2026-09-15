---
title: "[tips] CMake查找依赖包"
date: 2024-05-08 00:00:00
tags:
  - "CMake"
categories:
  - "Systems C++"
---

# 1. 背景
在软件开发时，我们不可避免会用到开源组件或者是其他人提供的库文件。如果开源软件或者是库文件严格按照CMake编译系统开发，并提供FindXXX.cmake或者是XXXConfig.cmake、xxx-config.cmake文件，用于辅助查找头文件和so库文件，那么软件的集成过程一般来说不会遇到编译问题。然而，如果开源软件使用的编译系统并非CMake，而是Makefile或者是meson等其他编译系统，亦或者库文件提供方并未提供足够的文件用于辅助编译，那么我们在CMake脚本中使用`find_package`将会遇到问题：
```
CMake Error at CMakeLists.txt:9 (find_package):
  By not providing "FindOSTree.cmake" in CMAKE_MODULE_PATH this project has
  asked CMake to find a package configuration file provided by "OSTree", but
  CMake did not find one.

  Could not find a package configuration file provided by "OSTree" with any
  of the following names:

    OSTreeConfig.cmake
    ostree-config.cmake

  Add the installation prefix of "OSTree" to CMAKE_PREFIX_PATH or set
  "OSTree_DIR" to a directory containing one of the above files.  If "OSTree"
  provides a separate development package or SDK, be sure it has been
  installed.
```
# 2. 问题分析
上面的报错我们以OSTree开源仓库为例，改仓库使用的是automake编译系统，因此没有提供FindOSTree.cmake，我们直接在CMake中通过`find_package`查找OSTree，自然会遇到问题。
## 2.1 `find_package`到底做了什么
在查找依赖包时，实际上是为了为代码编译时提供头文件搜素路径，以及链接时提供库文件的链接路径，`find_package`也就是完成这个功能的，因此它就负责查找`XXX_INCLUDE_DIRS`和`XXX_LIBRARIES`。其中XXX就是要查找的包。
## 2.2 `find_package`如何查找
查找时首先是判断用户是否提供了`CMAKE_MODULE_PATH`，这个我们根据报错也能看出来。如果用户提供了，那么CMake会在这个路径下查找`FindXXX.cmake`文件，并根据这个文件去查找依赖。如果`CMAKE_MODULE_PATH`没有提供，那么CMake就会去系统的Modules路径去查找包的配置文件，也就是上文报错信息提到的`XXXConfig.cmake`或者`
XXX-config.cmake`文件。系统的Modules目录一般是：`/usr/share/cmake-3.22/Modules`，在这里吗我们也能看到里面 有一些FindYYY.cmake的文件了。
# 自定义`FindXXX.cmake`
根据提示，我们可以在CMake中指定`CMAKE_MODULE_PATH`，并在这个路径下制作我们自己的FindXXX.cmake文件，以此来解决编译报错的问题，我们这里仍然以OSTree为例：
```
# FindOSTree.cmake

set(OSTREE_FOUND TRUE)
set(OSTREE_ROOT_DIR "/usr")

find_path(OSTREE_INCLUDE_DIR
    NAMES ostree.h
    HINTS ${OSTREE_ROOT_DIR}/include
    PATH_SUFFIXES ostree-1 src/libostree)
mark_as_advanced(OSTREE_INCLUDE_DIR)

find_library(OSTREE_LIBRARY
    NAMES libostree-1.so
    HINTS ${OSTREE_ROOT_DIR}/lib
    PATH_SUFFIXES /.libs)
mark_as_advanced(OSTREE_LIBRARY)

find_package(PkgConfig)

pkg_check_modules(OSTREE_GLIB REQUIRED gio-2.0 glib-2.0)

include(FindPackageHandleStandardArgs)

find_package_handle_standard_args(OSTree DEFAULT_MSG OSTREE_LIBRARY OSTREE_INCLUDE_DIR OSTREE_GLIB_FOUND)

set(OSTREE_INCLUDE_DIRS ${OSTREE_INCLUDE_DIR} ${OSTREE_GLIB_INCLUDE_DIRS})
set(OSTREE_LIBRARIES ${OSTREE_LIBRARY} ${OSTREE_GLIB_LIBRARIES})
```
代码中，我们使用find_path找到ostree头文件和库文件所在的目录，并赋值给`OSTREE_INCLUDE_DIR`和`OSTREE_LIBRARY`，同时更新`OSTREE_FOUND`为TRUE，将`OSTREE_INCLUDE_DIR`和`OSTREE_LIBRARY`这两个值分别设置给`OSTREE_INCLUDE_DIRS`和`OSTREE_LIBRARIES`，CMake实际是使用这两个变量的。到这里，FindOSTree.cmake就可以工作了，但是，由于OSTree实际上依赖于gio和glib这两个库，所以我们使用pkg_check_modules显示告诉OSTREE需要这两个库，否则编译仍然会报错找不到glib和gio。
gio和glib的FindGlib.cmake的文件内容如下：
```
if (GLIB2_LIBRARIES AND GLIB2_INCLUDE_DIRS)
    set(GLIB2_FOUND TRUE)
else (GLIB2_LIBRARIES AND GLIB2_INCLUDE_DIRS)
    include(FindPkgConfig)

	if (GLIB2_FIND_REQUIRED)
		set(_pkgconfig_REQURIED "REQUIRED")
	else (GLIB2_FIND_REQUIRED)
		set(_pkgconfig_REQURIED "")
	endif (GLIB2_FIND_REQUIRED)

	if (GLIB2_MIN_VERSION)
		pkg_search_module(GLIB2 ${_pkgconfig_REQUIRED} glib-2.0>=${GLIB2_MIN_VERSION})
	else (GLIB2_MIN_VERSION)
		pkg_search_module(GLIB2 ${_pkgconfig_REQUIRED} glib-2.0)
	endif (GLIB2_MIN_VERSION)

	if (PKG_CONFIG_FOUND)
		if (GLIB2_FOUND)
			set(GLIB2_CORE_FOUND TRUE)
		else (GLIB2_FOUND)
			set(GLIB2_CORE_FOUND FALSE)
		endif (GLIB2_FOUND)
	endif (PKG_CONFIG_FOUND)

	if (NOT GLIB2_FOUND AND NOT PKG_CONFIG_FOUND)
		find_path(_glibconfig_include_DIR
			NAMES glibconfig.h
			PATHS /usr/include
				/usr/lib
				/usr/lib64
				/usr/local/include
				${CMAKE_LIBRARY_PATH}
			PATH_SUFFIXES glib-2.0/include)

		find_path(_glib2_include_DIR
			NAMES glib.h gio.h
			PATHS
				/usr/include
				/usr/local/include
			PATH_SUFFIXES glib-2.0)

		find_library(_glib2_link_DIR
			NAMES
				glib-2.0
				glib
			PATHS
				/usr/lib
				/usr/local/lib
				/usr/lib64)

		if (_glib2_include_DIR AND _glib2_link_DIR)
			set(_glib2_FOUND TRUE)
		endif (_glib2_include_DIR AND _glib2_link_DIR)

		if (_glib2_FOUND)
			set(GLIB2_INCLUDE_DIRS ${_glib2_include_DIR} ${_glib2config_include_DIR})
			set(GLIB2_LIBRARIES ${_glib_link_DIR})
			set(GLIB2_CORE_FOUND TRUE)
		else (_glib2_FOUND)
			set(GLIB2_CORE_FOUND FALSE)
		endif (_glib2_FOUND)

		if (NOT LIBINTL_FOUND)
			find_path(LIBINTL_INCLUDE_DIR
				NAMES libintl.h
				PATHS
					/usr/include
					/usr/local/include)

			find_library(LIBINTL_LIBRARY
				NAMES intl
				PATHS
					/usr/lib
					/usr/local/lib)

			if (LIBINTL_LIBRARY AND LIBINTL_INCLUDE_DIR)
				set(LIBINTL_FOUND TRUE)
			endif (LIBINTL_LIBRARY AND LIBINTL_INCLUDE_DIR)
		endif (NOT LIBINTL_FOUND)

		if (NOT LIBICONV_FOUND)
			find_path(LIBICONV_INCLUDE_DIR
				NAMES iconv.h
				PATHS
					/usr/include
					/usr/local/include
				PATH_SUFFIXES glib-2.0)

			find_library(LIBICONV_LIBRARY
				NAMES iconv
				PATHS
					/usr/lib
					/usr/local/lib
					/usr/lib64)

			if (LIBICONV_INCLUDE_DIR AND LIBICONV_LIBRARY)
				set(LIBICONV_FOUND TRUE)
			endif (LIBICONV_INCLUDE_DIR AND LIBICONV_LIBRARY)
		endif (NOT LIBICONV_FOUND)

		if (LIBINTL_FOUND)
			set(GLIB2_LIBRARIES ${GLIB2_LIBRARIES} ${LIBINTL_LIBRARY})
			set(GLIB2_INCLUDE_DIRS ${GLIB2_INCLUDE_DIRS} ${LIBINTL_INCLUDE_DIR})
		endif (LIBINTL_FOUND)

		if (LIBICONV_FOUND)
			set(GLIB2_LIBRARIES ${GLIB2_LIBRARIES} ${LIBICONV_LIBRARY})
			set(GLIB2_INCLUDE_DIRS ${GLIB2_INCLUDE_DIRS} ${LIBICONV_INCLUDE_DIR})
		endif (LIBICONV_FOUND)

	endif (NOT GLIB2_FOUND AND NOT PKG_CONFIG_FOUND)

	if (GLIB2_CORE_FOUND AND GLIB2_INCLUDE_DIRS AND GLIB2_LIBRARIES)
			set(GLIB2_FOUND TRUE)
	endif (GLIB2_CORE_FOUND AND GLIB2_INCLUDE_DIRS AND GLIB2_LIBRARIES)

	if (GLIB2_FOUND)
		if (NOT GLIB2_FIND_QUIETLY)
			message(STATUS "Found GLib2: ${GLIB2_LIBRARIES} ${GLIB2_INCLUDE_DIRS}")
		endif (NOT GLIB2_FIND_QUIETLY)
	else (GLIB2_FOUND)
		if (NOT GLIB2_FIND_QUIETLY)
            message(STATUS "GLib2 not found.")
        endif (NOT GLIB2_FIND_QUIETLY)

	endif (GLIB2_FOUND)

	mark_as_advanced(GLIB2_INCLUDE_DIRS GLIB2_LIBRARIES)
	mark_as_advanced(LIBICONV_INCLUDE_DIR LIBICONV_LIBRARY)
	mark_as_advanced(LIBINTL_INCLUDE_DIR LIBINTL_LIBRARY)

endif (GLIB2_LIBRARIES AND GLIB2_INCLUDE_DIRS)

if (GLIB2_FOUND)
	include(CheckIncludeFiles)
	set(CMAKE_REQUIRED_INCLUDES ${GLIB2_INCLUDE_DIRS})
	check_include_files(glib/gregex.h HAVE_GLIB_GREGEX_H)
	set(CMAKE_REQUIRED_INCLUDES "")
endif (GLIB2_FOUND)
```
这里，GLIB还依赖于libiconv和libintl，但是我们也可以不编写他们的find文件，直接在glib里查找，
最后，将这俩个cmake文件放到工程目录下的cmake-modules目录，并在顶层CMake文件中生命CMAKE_MODULE_PATH即可。
当然，将这两个文件放到系统的Modules目录也是可以的。

[source issue](https://github.com/quinnwencn/blog/issues/29)
