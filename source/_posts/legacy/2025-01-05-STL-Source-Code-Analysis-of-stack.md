---
title: "[STL] Source Code Analysis of stack"
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
template <class _Tp, class _Sequence>
class stack {

  // requirements:

  __STL_CLASS_REQUIRES(_Tp, _Assignable);
  __STL_CLASS_REQUIRES(_Sequence, _BackInsertionSequence);
  typedef typename _Sequence::value_type _Sequence_value_type;
  __STL_CLASS_REQUIRES_SAME_TYPE(_Tp, _Sequence_value_type);


#ifdef __STL_MEMBER_TEMPLATES
  template <class _Tp1, class _Seq1>
  friend bool operator== (const stack<_Tp1, _Seq1>&,
                          const stack<_Tp1, _Seq1>&);
  template <class _Tp1, class _Seq1>
  friend bool operator< (const stack<_Tp1, _Seq1>&,
                         const stack<_Tp1, _Seq1>&);
#else /* __STL_MEMBER_TEMPLATES */
  friend bool __STD_QUALIFIER
  operator== __STL_NULL_TMPL_ARGS (const stack&, const stack&);
  friend bool __STD_QUALIFIER
  operator< __STL_NULL_TMPL_ARGS (const stack&, const stack&);
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
  stack() : c() {}
  explicit stack(const _Sequence& __s) : c(__s) {}

  bool empty() const { return c.empty(); }
  size_type size() const { return c.size(); }
  reference top() { return c.back(); }
  const_reference top() const { return c.back(); }
  void push(const value_type& __x) { c.push_back(__x); }
  void pop() { c.pop_back(); }
};
```
stack的特点是先进后出(Fist In Last Out, FILO)，只有一个方向的入口和出口，如下图所示：
![image](https://github.com/user-attachments/assets/15bb0b58-790e-4a85-a10f-97e5cc2ac5d7)

STL里的stack不是从零开始编写，而是以某个序列容器为基础，适配而成，这种设计模式也叫适配器。STL中默认使用deque作为这个序列化容器，其实也可以是vector或者是list，我认为list最适合，因为插入和取出的复杂度都是O(1)。
```Cpp
template <class _Tp, 
          class _Sequence __STL_DEPENDENT_DEFAULT_TMPL(deque<_Tp>) >
class stack;
```
stack是没有迭代器的，只有push和pop两个常见的修改函数，但是，pop的使用并不符合常理，需要先使用top获取栈顶元素后再弹出，否则就无法获取栈顶元素，合理的设计应该是类似于这样:
```Cpp
std::optional<Tp> pop();
```

[source issue](https://github.com/quinnwencn/blog/issues/93)
