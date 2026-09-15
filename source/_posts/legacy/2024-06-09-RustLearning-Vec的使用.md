---
title: "[RustLearning] Vec的使用"
date: 2024-06-09 00:00:00
tags:
  - "Rust"
categories:
  - "Rust"
---

Rust的Vec类似于C++的vector，是一个自增长的存储类型，可以不断往尾部push元素。 
# Vec的创建
Vec的创建目前已知有三种（我所知道的，后续可以补充），分别是new，vec!和使用迭代器collect。
## new
Rust中很多类型都提供了new方法来新建类型，譬如String、HashMap、HashSet，Vec同样也提供了new方法：
```Rust
let mut v = Vec::new();
v.push(1);
```
Rust中，类型新建时可以不指定类型，在用的时候由编译器推断类型。
## from
使用from来创建Vec时，参数是slice：
```Rust
fn create_vec_from(slice: &[u32]) -> Vec<u32> {
     Vec::from(slice)
}
```
## to_vec
从slice创建vec时，除了使用from外，还可以使用to_vec，这和str创建String是类似的：
```Rust
fn create_vec_from(slice: &[u32]) -> Vec<u32> {
     slice.to_vec()
}
```
## collect
collect作为迭代器方法，可以迭代时将满足条件的元素收集创建Vec：
```Rust
fn pick_top_tree(v: &Vec<u32>) -> Vec<u32>  {
    let copy_vec = v.clone();
    copy_vec.sort_unstable_by(|a, b| b.cmp(a));
    copy_vec.iter().take(3).cloned().collect()
}

# Vec的常用方法
* len(): 求Vec的长度
* capacity(): 获取当前vec的容量大小
* with_capacity(): 初始化一个特定容量的vec，通常用于知道vec的大小的情况
* shrink_to_fit(): 缩小vec的容量
* shrink_to(): 缩小vec的容量到指定大小
* reserve(): 预留至少指定容量大小
* pop()：弹出尾部元素，返回的是一个Option<T>, 可参考[Matching Brackets](https://exercism.org/tracks/rust/exercises/matching-brackets)

可以看出，这些方法和C++的vector的方法非常相似，我有理由推断vec的实现参考了C++的vector。

[source issue](https://github.com/quinnwencn/blog/issues/39)
