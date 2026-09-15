---
title: "[STL] iterators"
date: 2024-12-31 00:00:00
tags:
  - "C/C++"
  - "STL"
categories:
  - "Systems C++"
---

<p>STL的迭代器可以分为五类：
</p>
<p><em> Input Iterator：支持判断是否相等（a == b, a != b），可以解引用为一个右值（一次不能写，只能读）(</em>a, a->m)
</p>
<p><em> Output Iterator：可以解引用为左值，因此支持修改，当然也可以比较了 (</em>a = t, *a++ = t)
</p>
<p>* Forward Iterator： 继承自InputIterator和OutputIterator，对于mutable iterator可以解引用为左值
</p>
<p><em> Bidirectional Iterator：除了以上的操作外，还支持--操作(--a, a--, </em>a--)
</p>
<p>* Random Access Iterator： 支持+-操作，支持对比，支持+=，支持[]操作，就是随机访问(a + n, a - n, a - b， a< b, a <= b, a[n])
</p>
<p>这几个迭代器的继承关系如下图所示，从图中也能能理解上面的介绍：
</p>
<img src="https://github.com/user-attachments/assets/b4c3623d-45e6-40c6-bda6-e05c0b6d7cf5" alt="image" style="max-width:100%;">
<p>STL的算法都会基于迭代器实现三个版本，一个针对input iterator, 一份针对bidirectional iterator，还有一份是random access iterator。实现多个版本是为了提高性能，random access iterator的性能肯定比其他两个更强，比如我们看<code>advanced</code>的实现：
</p>
<p>* InputIterator版本：
</p>
<p>``<code>Cpp
</p>
<p>template <class InputIterator, class Distance>
</p>
<p>void advanc_II(InputIterator& i, Distance n) {
</p>
<p>       while (n--) ++i;
</p>
<p>}
</p>
</code>`<code>
<p>* BidirectionalIterator 版本
</p>
</code>`<code>Cpp
<p>template <class BidirectionalIterator, class Distance>
</p>
<p>void advance_BI(BidirectionalIterator& i, Distance n) {
</p>
<p>       if (n >= 0) {
</p>
<p>           while (n--) {
</p>
<p>               ++i;
</p>
<p>           }
</p>
<p>        } else {
</p>
<p>             while (n++) {
</p>
<p>                 --i;
</p>
<p>              }
</p>
<p>        }
</p>
<p>}
</p>
</code>`<code>
<p>* RandomAccessIterator 版本
</p>
</code>`<code>Cpp
<p>template <class RandomAccessIterator, class Distance>
</p>
<p>void advance_RAI(RandomAccessIterator& i, Distance n) {
</p>
<p>       i += n;
</p>
<p>}
</p>
</code>`<code>
<p>我们从代码层面也能看出来，Random Access Iterator版本的效率最高。同时，其他两个用的都是++i版本，因为这比i++效率更高。最后，再用一层对用户可见的函数封装：
</p>
</code>`<code>Cpp
<p>template <class InputIterator, class Distance>
</p>
<p>void advance(InputIterator& i, Distance n) {
</p>
<p>      if (is_random_access_iterator(i)) {
</p>
<p>            advance_RAI(i, n);
</p>
<p>      } else if (is_bidirectional_iterator(i)) {
</p>
<p>            advance_BI(i, n);
</p>
<p>      } else {
</p>
<p>            advance_II(i, n);
</p>
<p>      }
</p>
<p>}
</p>
</code>`<code>
<p>为了实现编译器就能确定使用哪个版本，STL提供了traits机制， 首先为这几个Iterator提供了标签：
</p>
</code>`<code>Cpp
<p>struct input_iteraotr_tag {};
</p>
<p>struct output_iterator_tag {};
</p>
<p>struct forward_iterator_tag: public input_iterator_tag {};
</p>
<p>struct bidirectional_iterator_tag: public forward_iterator_tag {};
</p>
<p>struct random_access_iterator_tag: public bidirectional_tag {};
</p>
</code>`<code>
<p>然后就可以将前面的</code>advance_II<code>等改为一个内部函数：
</p>
</code>`<code>Cpp
<p>template <class InputIterator, class Distance>
</p>
<p>void __advance(InputIterator& i, Distance n, input_iterator_tag) {
</p>
<p>       while (n--) ++i;
</p>
<p>}
</p>
</code>`<code>
<p>其他同理，不再赘述。然后在对用户可见的</code>advance<code>利用traits机制，提取类型即可：
</p>
</code>`<code>Cpp
<p>template <class InputIterator, class Distance>
</p>
<p>void advance(InputIterator& i, Distance n) {
</p>
<p>      __advance(i, n, iterator_traits<InputIterator>::iterator_category());
</p>
<p>}
</p>
</code>`<code>
<p>然后针对特殊类型部分特化即可（partial-specialization）:
</p>
</code>`<code>Cpp
<p>template <class T>
</p>
<p>struct iterator_traits<T*> {
</p>
<p>// ...
</p>
<p>    typedef random_access_iterator_tag iterator_category;
</p>
<p>}；
</p>
</code>`<code>
<h2>__type_traits机制
</h2>
<p>由于iterator_traits机制实在是太好用了，STL扩展了这个用法，在类型提取上也开始大展身手。比如之前列举的</code>__true_type<code>和</code>__false_type<code>，也是得益于这个机制。常用的有：
</p>
</code>`<code>Cpp
<p>__type_traits<T>::has_trivial_default_constructor;
</p>
<p>__type_traits<T>::has_trivial_copy_constructor;
</p>
<p>__type_traits<T>::has_trivial_assignment_operator;
</p>
<p>__type_traits<T>::has_trivial_destructor;
</p>
<p>__type_traits<T>::is_POD_type;
</p>
</code>``
<h1>Reference
</h1>
<li>《STL 源码剖析》
</li>
