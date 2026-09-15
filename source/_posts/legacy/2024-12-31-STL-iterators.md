---
title: "[STL] iterators"
date: 2024-12-31 00:00:00
tags:
  - "C/C++"
  - "STL"
categories:
  - "Systems C++"
---

STL的迭代器可以分为五类：
* Input Iterator：支持判断是否相等（a == b, a != b），可以解引用为一个右值（一次不能写，只能读）(*a, a->m)
* Output Iterator：可以解引用为左值，因此支持修改，当然也可以比较了 (*a = t, *a++ = t)
* Forward Iterator： 继承自InputIterator和OutputIterator，对于mutable iterator可以解引用为左值
* Bidirectional Iterator：除了以上的操作外，还支持--操作(--a, a--, *a--)
* Random Access Iterator： 支持+-操作，支持对比，支持+=，支持[]操作，就是随机访问(a + n, a - n, a - b， a< b, a <= b, a[n])

这几个迭代器的继承关系如下图所示，从图中也能能理解上面的介绍：
![image](https://github.com/user-attachments/assets/b4c3623d-45e6-40c6-bda6-e05c0b6d7cf5)

STL的算法都会基于迭代器实现三个版本，一个针对input iterator, 一份针对bidirectional iterator，还有一份是random access iterator。实现多个版本是为了提高性能，random access iterator的性能肯定比其他两个更强，比如我们看`advanced`的实现：
* InputIterator版本：
```Cpp
template <class InputIterator, class Distance>
void advanc_II(InputIterator& i, Distance n) {
       while (n--) ++i;
}
```

* BidirectionalIterator 版本
```Cpp
template <class BidirectionalIterator, class Distance>
void advance_BI(BidirectionalIterator& i, Distance n) {
       if (n >= 0) {
           while (n--) {
               ++i;
           }
        } else {
             while (n++) {
                 --i;
              }
        }
}
```

* RandomAccessIterator 版本
```Cpp
template <class RandomAccessIterator, class Distance>
void advance_RAI(RandomAccessIterator& i, Distance n) {
       i += n;
}
```
我们从代码层面也能看出来，Random Access Iterator版本的效率最高。同时，其他两个用的都是++i版本，因为这比i++效率更高。最后，再用一层对用户可见的函数封装：
```Cpp
template <class InputIterator, class Distance>
void advance(InputIterator& i, Distance n) {
      if (is_random_access_iterator(i)) {
            advance_RAI(i, n);
      } else if (is_bidirectional_iterator(i)) {
            advance_BI(i, n);
      } else {
            advance_II(i, n);
      }
}
```
为了实现编译器就能确定使用哪个版本，STL提供了traits机制， 首先为这几个Iterator提供了标签：
```Cpp
struct input_iteraotr_tag {};
struct output_iterator_tag {};
struct forward_iterator_tag: public input_iterator_tag {};
struct bidirectional_iterator_tag: public forward_iterator_tag {};
struct random_access_iterator_tag: public bidirectional_tag {};
```
然后就可以将前面的`advance_II`等改为一个内部函数：
```Cpp
template <class InputIterator, class Distance>
void __advance(InputIterator& i, Distance n, input_iterator_tag) {
       while (n--) ++i;
}
```
其他同理，不再赘述。然后在对用户可见的`advance`利用traits机制，提取类型即可：
```Cpp
template <class InputIterator, class Distance>
void advance(InputIterator& i, Distance n) {
      __advance(i, n, iterator_traits<InputIterator>::iterator_category());
}
```
然后针对特殊类型部分特化即可（partial-specialization）:
```Cpp
template <class T>
struct iterator_traits<T*> {
// ...
    typedef random_access_iterator_tag iterator_category;
}；
```
## __type_traits机制
由于iterator_traits机制实在是太好用了，STL扩展了这个用法，在类型提取上也开始大展身手。比如之前列举的`__true_type`和`__false_type`，也是得益于这个机制。常用的有：
```Cpp
__type_traits<T>::has_trivial_default_constructor;
__type_traits<T>::has_trivial_copy_constructor;
__type_traits<T>::has_trivial_assignment_operator;
__type_traits<T>::has_trivial_destructor;
__type_traits<T>::is_POD_type;
```

# Reference
1. 《STL 源码剖析》

[source issue](https://github.com/quinnwencn/blog/issues/89)
