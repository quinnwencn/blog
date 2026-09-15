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

<h1>源码
</h1>
<p>``<code>Cpp
</p>
<p>template <class _Tp, class _Sequence>
</p>
<p>class stack {
</p>
<p>  // requirements:
</p>
<p>  __STL_CLASS_REQUIRES(_Tp, _Assignable);
</p>
<p>  __STL_CLASS_REQUIRES(_Sequence, _BackInsertionSequence);
</p>
<p>  typedef typename _Sequence::value_type _Sequence_value_type;
</p>
<p>  __STL_CLASS_REQUIRES_SAME_TYPE(_Tp, _Sequence_value_type);
</p>
<p>#ifdef __STL_MEMBER_TEMPLATES
</p>
<p>  template <class _Tp1, class _Seq1>
</p>
<p>  friend bool operator== (const stack<_Tp1, _Seq1>&,
</p>
<p>                          const stack<_Tp1, _Seq1>&);
</p>
<p>  template <class _Tp1, class _Seq1>
</p>
<p>  friend bool operator< (const stack<_Tp1, _Seq1>&,
</p>
<p>                         const stack<_Tp1, _Seq1>&);
</p>
<p>#else /<em> __STL_MEMBER_TEMPLATES </em>/
</p>
<p>  friend bool __STD_QUALIFIER
</p>
<p>  operator== __STL_NULL_TMPL_ARGS (const stack&, const stack&);
</p>
<p>  friend bool __STD_QUALIFIER
</p>
<p>  operator< __STL_NULL_TMPL_ARGS (const stack&, const stack&);
</p>
<p>#endif /<em> __STL_MEMBER_TEMPLATES </em>/
</p>
<p>public:
</p>
<p>  typedef typename _Sequence::value_type      value_type;
</p>
<p>  typedef typename _Sequence::size_type       size_type;
</p>
<p>  typedef          _Sequence                  container_type;
</p>
<p>  typedef typename _Sequence::reference       reference;
</p>
<p>  typedef typename _Sequence::const_reference const_reference;
</p>
<p>protected:
</p>
<p>  _Sequence c;
</p>
<p>public:
</p>
<p>  stack() : c() {}
</p>
<p>  explicit stack(const _Sequence& __s) : c(__s) {}
</p>
<p>  bool empty() const { return c.empty(); }
</p>
<p>  size_type size() const { return c.size(); }
</p>
<p>  reference top() { return c.back(); }
</p>
<p>  const_reference top() const { return c.back(); }
</p>
<p>  void push(const value_type& __x) { c.push_back(__x); }
</p>
<p>  void pop() { c.pop_back(); }
</p>
<p>};
</p>
</code>`<code>
<p>stack的特点是先进后出(Fist In Last Out, FILO)，只有一个方向的入口和出口，如下图所示：
</p>
<img src="https://github.com/user-attachments/assets/15bb0b58-790e-4a85-a10f-97e5cc2ac5d7" alt="image" style="max-width:100%;">
<p>STL里的stack不是从零开始编写，而是以某个序列容器为基础，适配而成，这种设计模式也叫适配器。STL中默认使用deque作为这个序列化容器，其实也可以是vector或者是list，我认为list最适合，因为插入和取出的复杂度都是O(1)。
</p>
</code>`<code>Cpp
<p>template <class _Tp,
</p>
<p>          class _Sequence __STL_DEPENDENT_DEFAULT_TMPL(deque<_Tp>) >
</p>
<p>class stack;
</p>
</code>`<code>
<p>stack是没有迭代器的，只有push和pop两个常见的修改函数，但是，pop的使用并不符合常理，需要先使用top获取栈顶元素后再弹出，否则就无法获取栈顶元素，合理的设计应该是类似于这样:
</p>
</code>`<code>Cpp
<p>std::optional<Tp> pop();
</p>
</code>``
