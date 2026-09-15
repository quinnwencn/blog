---
title: "[STL] Source Code Analysis of queue"
date: 2025-01-05 00:00:00
tags:
  - "C/C++"
  - "STL"
  - "SGI"
categories:
  - "Systems C++"
---

# 源码
```Cpp
template <class _Tp, 
          class _Sequence __STL_DEPENDENT_DEFAULT_TMPL(deque<_Tp>) >   // 默认使用deque适配
class queue;


template <class _Tp, class _Sequence>
class queue {

  // requirements:

  __STL_CLASS_REQUIRES(_Tp, _Assignable);
  __STL_CLASS_REQUIRES(_Sequence, _FrontInsertionSequence);
  __STL_CLASS_REQUIRES(_Sequence, _BackInsertionSequence);
  typedef typename _Sequence::value_type _Sequence_value_type;
  __STL_CLASS_REQUIRES_SAME_TYPE(_Tp, _Sequence_value_type);


#ifdef __STL_MEMBER_TEMPLATES 
  template <class _Tp1, class _Seq1>
  friend bool operator== (const queue<_Tp1, _Seq1>&,
                          const queue<_Tp1, _Seq1>&);
  template <class _Tp1, class _Seq1>
  friend bool operator< (const queue<_Tp1, _Seq1>&,
                         const queue<_Tp1, _Seq1>&);
#else /* __STL_MEMBER_TEMPLATES */
  friend bool __STD_QUALIFIER
  operator== __STL_NULL_TMPL_ARGS (const queue&, const queue&);
  friend bool __STD_QUALIFIER
  operator<  __STL_NULL_TMPL_ARGS (const queue&, const queue&);
#endif /* __STL_MEMBER_TEMPLATES */

public:
  typedef typename _Sequence::value_type      value_type;
  typedef typename _Sequence::size_type       size_type;
  typedef          _Sequence                  container_type;

  typedef typename _Sequence::reference       reference;
  typedef typename _Sequence::const_reference const_reference;
protected:
  _Sequence c;
public:
  queue() : c() {}
  explicit queue(const _Sequence& __c) : c(__c) {}

  bool empty() const { return c.empty(); }
  size_type size() const { return c.size(); }
  reference front() { return c.front(); }
  const_reference front() const { return c.front(); }
  reference back() { return c.back(); }
  const_reference back() const { return c.back(); }
  void push(const value_type& __x) { c.push_back(__x); }
  void pop() { c.pop_front(); }
};
```

`queue`是一个先进先出(First In First Out, FIFO)的数据结构，有两个开口方向，如下图所示：
![image](https://github.com/user-attachments/assets/17de0891-65f5-4653-bd97-9759f286e27a)

由于先进先出的特点，`queue`的插入和弹出的方向不一样，顶部弹出元素，底部插入元素，因此也不允许遍历容器，也就没有迭代器了。

从上述源码可以看出，`queue`也是使用`deque`适配而成，使用适配器，适配出以下接口：
```Cpp
  bool empty() const { return c.empty(); }
  size_type size() const { return c.size(); }
  reference front() { return c.front(); }
  const_reference front() const { return c.front(); }
  reference back() { return c.back(); }
  const_reference back() const { return c.back(); }
  void push(const value_type& __x) { c.push_back(__x); }
  void pop() { c.pop_front(); }
```
但是，论空间利用率和高效而言，推荐使用`list`作为底层容器适配`queue`：
```Cpp
std::queue<int, list<int>> ique;
ique.push(1);
ique.push(2);

std::cout << ique.size() << std::endl;
std::cout << ique.top() << std::endl;

ique.pop();
```

[source issue](https://github.com/quinnwencn/blog/issues/94)
