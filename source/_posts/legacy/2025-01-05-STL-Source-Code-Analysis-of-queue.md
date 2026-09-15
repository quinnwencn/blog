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

<h1>源码
</h1>
<p>``<code>Cpp
</p>
<p>template <class _Tp,
</p>
<p>          class _Sequence __STL_DEPENDENT_DEFAULT_TMPL(deque<_Tp>) >   // 默认使用deque适配
</p>
<p>class queue;
</p>
<p>template <class _Tp, class _Sequence>
</p>
<p>class queue {
</p>
<p>  // requirements:
</p>
<p>  __STL_CLASS_REQUIRES(_Tp, _Assignable);
</p>
<p>  __STL_CLASS_REQUIRES(_Sequence, _FrontInsertionSequence);
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
<p>  friend bool operator== (const queue<_Tp1, _Seq1>&,
</p>
<p>                          const queue<_Tp1, _Seq1>&);
</p>
<p>  template <class _Tp1, class _Seq1>
</p>
<p>  friend bool operator< (const queue<_Tp1, _Seq1>&,
</p>
<p>                         const queue<_Tp1, _Seq1>&);
</p>
<p>#else /<em> __STL_MEMBER_TEMPLATES </em>/
</p>
<p>  friend bool __STD_QUALIFIER
</p>
<p>  operator== __STL_NULL_TMPL_ARGS (const queue&, const queue&);
</p>
<p>  friend bool __STD_QUALIFIER
</p>
<p>  operator<  __STL_NULL_TMPL_ARGS (const queue&, const queue&);
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
<p>  queue() : c() {}
</p>
<p>  explicit queue(const _Sequence& __c) : c(__c) {}
</p>
<p>  bool empty() const { return c.empty(); }
</p>
<p>  size_type size() const { return c.size(); }
</p>
<p>  reference front() { return c.front(); }
</p>
<p>  const_reference front() const { return c.front(); }
</p>
<p>  reference back() { return c.back(); }
</p>
<p>  const_reference back() const { return c.back(); }
</p>
<p>  void push(const value_type& __x) { c.push_back(__x); }
</p>
<p>  void pop() { c.pop_front(); }
</p>
<p>};
</p>
</code>`<code>
</code>queue<code>是一个先进先出(First In First Out, FIFO)的数据结构，有两个开口方向，如下图所示：
<img src="https://github.com/user-attachments/assets/17de0891-65f5-4653-bd97-9759f286e27a" alt="image" style="max-width:100%;">
<p>由于先进先出的特点，</code>queue<code>的插入和弹出的方向不一样，顶部弹出元素，底部插入元素，因此也不允许遍历容器，也就没有迭代器了。
</p>
<p>从上述源码可以看出，</code>queue<code>也是使用</code>deque<code>适配而成，使用适配器，适配出以下接口：
</p>
</code>`<code>Cpp
<p>  bool empty() const { return c.empty(); }
</p>
<p>  size_type size() const { return c.size(); }
</p>
<p>  reference front() { return c.front(); }
</p>
<p>  const_reference front() const { return c.front(); }
</p>
<p>  reference back() { return c.back(); }
</p>
<p>  const_reference back() const { return c.back(); }
</p>
<p>  void push(const value_type& __x) { c.push_back(__x); }
</p>
<p>  void pop() { c.pop_front(); }
</p>
</code>`<code>
<p>但是，论空间利用率和高效而言，推荐使用</code>list<code>作为底层容器适配</code>queue<code>：
</p>
</code>`<code>Cpp
<p>std::queue<int, list<int>> ique;
</p>
<p>ique.push(1);
</p>
<p>ique.push(2);
</p>
<p>std::cout << ique.size() << std::endl;
</p>
<p>std::cout << ique.top() << std::endl;
</p>
<p>ique.pop();
</p>
</code>``
