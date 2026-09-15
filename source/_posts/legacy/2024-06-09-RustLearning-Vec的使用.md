---
title: "[RustLearning] Vec的使用"
date: 2024-06-09 00:00:00
tags:
  - "Rust"
categories:
  - "Rust"
---

<p>Rust的Vec类似于C++的vector，是一个自增长的存储类型，可以不断往尾部push元素。
</p>
<h1>Vec的创建
</h1>
<p>Vec的创建目前已知有三种（我所知道的，后续可以补充），分别是new，vec!和使用迭代器collect。
</p>
<h2>new
</h2>
<p>Rust中很多类型都提供了new方法来新建类型，譬如String、HashMap、HashSet，Vec同样也提供了new方法：
</p>
<p>``<code>Rust
</p>
<p>let mut v = Vec::new();
</p>
<p>v.push(1);
</p>
</code>`<code>
<p>Rust中，类型新建时可以不指定类型，在用的时候由编译器推断类型。
</p>
<h2>from
</h2>
<p>使用from来创建Vec时，参数是slice：
</p>
</code>`<code>Rust
<p>fn create_vec_from(slice: &[u32]) -> Vec<u32> {
</p>
<p>     Vec::from(slice)
</p>
<p>}
</p>
</code>`<code>
<h2>to_vec
</h2>
<p>从slice创建vec时，除了使用from外，还可以使用to_vec，这和str创建String是类似的：
</p>
</code>`<code>Rust
<p>fn create_vec_from(slice: &[u32]) -> Vec<u32> {
</p>
<p>     slice.to_vec()
</p>
<p>}
</p>
</code>`<code>
<h2>collect
</h2>
<p>collect作为迭代器方法，可以迭代时将满足条件的元素收集创建Vec：
</p>
</code>``Rust
<p>fn pick_top_tree(v: &Vec<u32>) -> Vec<u32>  {
</p>
<p>    let copy_vec = v.clone();
</p>
<p>    copy_vec.sort_unstable_by(|a, b| b.cmp(a));
</p>
<p>    copy_vec.iter().take(3).cloned().collect()
</p>
<p>}
</p>
<h1>Vec的常用方法
</h1>
<p>* len(): 求Vec的长度
</p>
<p>* capacity(): 获取当前vec的容量大小
</p>
<p>* with_capacity(): 初始化一个特定容量的vec，通常用于知道vec的大小的情况
</p>
<p>* shrink_to_fit(): 缩小vec的容量
</p>
<p>* shrink_to(): 缩小vec的容量到指定大小
</p>
<p>* reserve(): 预留至少指定容量大小
</p>
<p>* pop()：弹出尾部元素，返回的是一个Option<T>, 可参考<a href="https://exercism.org/tracks/rust/exercises/matching-brackets">Matching Brackets</a>
</p>
<p>可以看出，这些方法和C++的vector的方法非常相似，我有理由推断vec的实现参考了C++的vector。</p>
