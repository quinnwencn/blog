---
title: "[STL] Source Code Analysis of list"
date: 2025-01-04 00:00:00
tags:
  - "C/C++"
  - "STL"
  - "SGI"
categories:
  - "Systems C++"
---

# 源码
SGI的STL中，list的定义如下：
```Cpp
struct _List_node_base {  // 双指针定义
  _List_node_base* _M_next;
  _List_node_base* _M_prev;
};

template <class _Tp>
struct _List_node : public _List_node_base {  // 存储的数据，继承自双链表结构体，因此也具有双指针
  _Tp _M_data;
};

template <class _Tp, class _Alloc>
class _List_base 
{
public:
  typedef _Alloc allocator_type;
  allocator_type get_allocator() const { return allocator_type(); }

  _List_base(const allocator_type&) {  // 构造函数构造一个节点，prev和next指针都指向当前节点
    _M_node = _M_get_node();
    _M_node->_M_next = _M_node;
    _M_node->_M_prev = _M_node;  // 这里的prev始终指向头节点
  }
  ~_List_base() {
    clear();  // 析构过程肯定需要对next指向的节点也析构，这个待会看源码
    _M_put_node(_M_node);
  }

  void clear();

protected:
  typedef simple_alloc<_List_node<_Tp>, _Alloc> _Alloc_type;   // 仍然是使用二级内存配置器
  _List_node<_Tp>* _M_get_node() { return _Alloc_type::allocate(1); }  // 实际上是分配一个节点
  void _M_put_node(_List_node<_Tp>* __p) { _Alloc_type::deallocate(__p, 1); }  // 释放内存到二级内存分配器链表

protected:
  _List_node<_Tp>* _M_node;
};


template <class _Tp, class _Alloc>
void 
_List_base<_Tp,_Alloc>::clear() 
{
  _List_node<_Tp>* __cur = (_List_node<_Tp>*) _M_node->_M_next;  // cur指向当前节点的下一个节点
  while (__cur != _M_node) {  // 把next指向的节点统统析构和放回内存链表
    _List_node<_Tp>* __tmp = __cur;
    __cur = (_List_node<_Tp>*) __cur->_M_next; // 由于_M_next是_List_node_base*类型，因此要强转成_List_node * 类型
    _Destroy(&__tmp->_M_data);  // 先析构
    _M_put_node(__tmp); // 再放回二级内存配置器的内存链表中
  }
  _M_node->_M_next = _M_node;  // 将next指针指向当前节点
  _M_node->_M_prev = _M_node; //  将prev指针指向当前节点
}

// 对外暴露的list继承自_list_base:
class list : protected _List_base<_Tp, _Alloc> {
  // requirements:

  __STL_CLASS_REQUIRES(_Tp, _Assignable);

  typedef _List_base<_Tp, _Alloc> _Base;
protected:
  typedef void* _Void_pointer;

public:      
  typedef _Tp value_type;
  typedef value_type* pointer;
  typedef const value_type* const_pointer;
  typedef value_type& reference;
  typedef const value_type& const_reference;
  typedef _List_node<_Tp> _Node;
  typedef size_t size_type;
  typedef ptrdiff_t difference_type;

  typedef typename _Base::allocator_type allocator_type;
  allocator_type get_allocator() const { return _Base::get_allocator(); }

public:
  typedef _List_iterator<_Tp,_Tp&,_Tp*>             iterator;
  typedef _List_iterator<_Tp,const _Tp&,const _Tp*> const_iterator;

#ifdef __STL_CLASS_PARTIAL_SPECIALIZATION
  typedef reverse_iterator<const_iterator> const_reverse_iterator;
  typedef reverse_iterator<iterator>       reverse_iterator;
#else /* __STL_CLASS_PARTIAL_SPECIALIZATION */
  typedef reverse_bidirectional_iterator<const_iterator,value_type,
                                         const_reference,difference_type>
          const_reverse_iterator;
  typedef reverse_bidirectional_iterator<iterator,value_type,reference,
                                         difference_type>
          reverse_iterator; 
#endif /* __STL_CLASS_PARTIAL_SPECIALIZATION */

protected:
#ifdef __STL_HAS_NAMESPACES
  using _Base::_M_node;
  using _Base::_M_put_node;  // 释放内存
  using _Base::_M_get_node;  // 申请内存
#endif /* __STL_HAS_NAMESPACES */

protected:
  _Node* _M_create_node(const _Tp& __x)  // 申请节点并使用入参构造
  {
    _Node* __p = _M_get_node();  
    __STL_TRY {
      _Construct(&__p->_M_data, __x);
    }
    __STL_UNWIND(_M_put_node(__p));
    return __p;
  }

  _Node* _M_create_node()  // 申请节点并默认构造
  {
    _Node* __p = _M_get_node();
    __STL_TRY {
      _Construct(&__p->_M_data);
    }
    __STL_UNWIND(_M_put_node(__p));
    return __p;
  }

public:
  explicit list(const allocator_type& __a = allocator_type()) : _Base(__a) {}

  iterator begin()             { return (_Node*)(_M_node->_M_next); } // list的begin是this节点的下一个，也就是说this节点不存储数据，不给用户使用
  const_iterator begin() const { return (_Node*)(_M_node->_M_next); }  

  iterator end()             { return _M_node; }  // this 节点就是end
  const_iterator end() const { return _M_node; }

  reverse_iterator rbegin() 
    { return reverse_iterator(end()); }
  const_reverse_iterator rbegin() const 
    { return const_reverse_iterator(end()); }

  reverse_iterator rend()
    { return reverse_iterator(begin()); }
  const_reverse_iterator rend() const
    { return const_reverse_iterator(begin()); }

  bool empty() const { return _M_node->_M_next == _M_node; } //  this节点不给用户使用，所以判断是不是空只需要看next是不是指向this节点
  size_type size() const {
    size_type __result = 0;
    distance(begin(), end(), __result);
    return __result;
  }
  size_type max_size() const { return size_type(-1); }

  reference front() { return *begin(); } 
  const_reference front() const { return *begin(); }
  reference back() { return *(--end()); } 
  const_reference back() const { return *(--end()); }

  void swap(list<_Tp, _Alloc>& __x) { __STD::swap(_M_node, __x._M_node); }  // **this节点可以说是哨兵，swap'的时候，直接swap哨兵就可以了**

  iterator insert(iterator __position, const _Tp& __x) {
    _Node* __tmp = _M_create_node(__x);
    __tmp->_M_next = __position._M_node;
    __tmp->_M_prev = __position._M_node->_M_prev;
    __position._M_node->_M_prev->_M_next = __tmp;
    __position._M_node->_M_prev = __tmp;
    return __tmp;
  }
  iterator insert(iterator __position) { return insert(__position, _Tp()); }
#ifdef __STL_MEMBER_TEMPLATES
  // Check whether it's an integral type.  If so, it's not an iterator.

  template<class _Integer>
  void _M_insert_dispatch(iterator __pos, _Integer __n, _Integer __x,
                          __true_type) {
    _M_fill_insert(__pos, (size_type) __n, (_Tp) __x);
  }

  template <class _InputIterator>
  void _M_insert_dispatch(iterator __pos,
                          _InputIterator __first, _InputIterator __last,
                          __false_type);

  template <class _InputIterator>
  void insert(iterator __pos, _InputIterator __first, _InputIterator __last) {
    typedef typename _Is_integer<_InputIterator>::_Integral _Integral;
    _M_insert_dispatch(__pos, __first, __last, _Integral());
  }

#else /* __STL_MEMBER_TEMPLATES */
  void insert(iterator __position, const _Tp* __first, const _Tp* __last);
  void insert(iterator __position,
              const_iterator __first, const_iterator __last);
#endif /* __STL_MEMBER_TEMPLATES */
  void insert(iterator __pos, size_type __n, const _Tp& __x)
    { _M_fill_insert(__pos, __n, __x); }
  void _M_fill_insert(iterator __pos, size_type __n, const _Tp& __x); 

  void push_front(const _Tp& __x) { insert(begin(), __x); }
  void push_front() {insert(begin());}
  void push_back(const _Tp& __x) { insert(end(), __x); }
  void push_back() {insert(end());}

  iterator erase(iterator __position) {
    _List_node_base* __next_node = __position._M_node->_M_next;
    _List_node_base* __prev_node = __position._M_node->_M_prev;
    _Node* __n = (_Node*) __position._M_node;
    __prev_node->_M_next = __next_node;
    __next_node->_M_prev = __prev_node;
    _Destroy(&__n->_M_data);
    _M_put_node(__n);
    return iterator((_Node*) __next_node);
  }
  iterator erase(iterator __first, iterator __last);
  void clear() { _Base::clear(); }

  void resize(size_type __new_size, const _Tp& __x);
  void resize(size_type __new_size) { this->resize(__new_size, _Tp()); }

  void pop_front() { erase(begin()); }
  void pop_back() { 
    iterator __tmp = end();
    erase(--__tmp);
  }
  list(size_type __n, const _Tp& __value,
       const allocator_type& __a = allocator_type())
    : _Base(__a)
    { insert(begin(), __n, __value); }
  explicit list(size_type __n)
    : _Base(allocator_type())
    { insert(begin(), __n, _Tp()); }

#ifdef __STL_MEMBER_TEMPLATES

  // We don't need any dispatching tricks here, because insert does all of
  // that anyway.  
  template <class _InputIterator>
  list(_InputIterator __first, _InputIterator __last,
       const allocator_type& __a = allocator_type())
    : _Base(__a)
    { insert(begin(), __first, __last); }

#else /* __STL_MEMBER_TEMPLATES */

  list(const _Tp* __first, const _Tp* __last,
       const allocator_type& __a = allocator_type())
    : _Base(__a)
    { this->insert(begin(), __first, __last); }
  list(const_iterator __first, const_iterator __last,
       const allocator_type& __a = allocator_type())
    : _Base(__a)
    { this->insert(begin(), __first, __last); }

#endif /* __STL_MEMBER_TEMPLATES */
  list(const list<_Tp, _Alloc>& __x) : _Base(__x.get_allocator())
    { insert(begin(), __x.begin(), __x.end()); }

  ~list() { }

  list<_Tp, _Alloc>& operator=(const list<_Tp, _Alloc>& __x);

public:
  // assign(), a generalized assignment member function.  Two
  // versions: one that takes a count, and one that takes a range.
  // The range version is a member template, so we dispatch on whether
  // or not the type is an integer.

  void assign(size_type __n, const _Tp& __val) { _M_fill_assign(__n, __val); }

  void _M_fill_assign(size_type __n, const _Tp& __val);

#ifdef __STL_MEMBER_TEMPLATES

  template <class _InputIterator>
  void assign(_InputIterator __first, _InputIterator __last) {
    typedef typename _Is_integer<_InputIterator>::_Integral _Integral;
    _M_assign_dispatch(__first, __last, _Integral());
  }

  template <class _Integer>
  void _M_assign_dispatch(_Integer __n, _Integer __val, __true_type)
    { _M_fill_assign((size_type) __n, (_Tp) __val); }

  template <class _InputIterator>
  void _M_assign_dispatch(_InputIterator __first, _InputIterator __last,
                          __false_type);

#endif /* __STL_MEMBER_TEMPLATES */

protected:
  void transfer(iterator __position, iterator __first, iterator __last) {
    if (__position != __last) {
      // Remove [first, last) from its old position.
      __last._M_node->_M_prev->_M_next     = __position._M_node;
      __first._M_node->_M_prev->_M_next    = __last._M_node;
      __position._M_node->_M_prev->_M_next = __first._M_node; 

      // Splice [first, last) into its new position.
      _List_node_base* __tmp      = __position._M_node->_M_prev;
      __position._M_node->_M_prev = __last._M_node->_M_prev;
      __last._M_node->_M_prev     = __first._M_node->_M_prev; 
      __first._M_node->_M_prev    = __tmp;
    }
  }

public:
  void splice(iterator __position, list& __x) {
    if (!__x.empty()) 
      this->transfer(__position, __x.begin(), __x.end());
  }
  void splice(iterator __position, list&, iterator __i) {
    iterator __j = __i;
    ++__j;
    if (__position == __i || __position == __j) return;
    this->transfer(__position, __i, __j);
  }
  void splice(iterator __position, list&, iterator __first, iterator __last) {
    if (__first != __last) 
      this->transfer(__position, __first, __last);
  }
  void remove(const _Tp& __value);
  void unique();
  void merge(list& __x);
  void reverse();
  void sort();

#ifdef __STL_MEMBER_TEMPLATES
  template <class _Predicate> void remove_if(_Predicate);
  template <class _BinaryPredicate> void unique(_BinaryPredicate);
  template <class _StrictWeakOrdering> void merge(list&, _StrictWeakOrdering);
  template <class _StrictWeakOrdering> void sort(_StrictWeakOrdering);
#endif /* __STL_MEMBER_TEMPLATES */
};
```
虽然链表使用了继承来实现数据和双指针，但是仍然可以用下图表示：
![image](https://github.com/user-attachments/assets/e05280b2-6a41-4607-8669-122b956365ba)

由上图可以看出，list的迭代器类型应该是一个bidirectional iterator，代码中也是如此定义的：
```Cpp
struct _List_iterator_base {
  typedef size_t                     size_type;
  typedef ptrdiff_t                  difference_type;
  typedef bidirectional_iterator_tag iterator_category;

  _List_node_base* _M_node;

  _List_iterator_base(_List_node_base* __x) : _M_node(__x) {}
  _List_iterator_base() {}

  void _M_incr() { _M_node = _M_node->_M_next; } // 定义了递增，这会在继承类中得到体现
  void _M_decr() { _M_node = _M_node->_M_prev; } // 和递减，这会在继承类中得到体现

  bool operator==(const _List_iterator_base& __x) const {
    return _M_node == __x._M_node;
  }
  bool operator!=(const _List_iterator_base& __x) const {
    return _M_node != __x._M_node;
  }
};  
```

不同于`vector`，插入后，插入节点之后的迭代器都会失效，删除也是。`list`的插入和删除都不会导致其他迭代器失效，因为list的迭代器都是指针，插入和删除不会影响其他指针。
![image](https://github.com/user-attachments/assets/2cfd25f7-33f0-40a0-9b16-7eccc68c0ca4)

迭代器的继承类，也就是实际的迭代器，上述的base迭代器只定义了基本功能：
```Cpp
template<class _Tp, class _Ref, class _Ptr>
struct _List_iterator : public _List_iterator_base {
  typedef _List_iterator<_Tp,_Tp&,_Tp*>             iterator;
  typedef _List_iterator<_Tp,const _Tp&,const _Tp*> const_iterator;
  typedef _List_iterator<_Tp,_Ref,_Ptr>             _Self;

  typedef _Tp value_type;
  typedef _Ptr pointer;
  typedef _Ref reference;
  typedef _List_node<_Tp> _Node;

  _List_iterator(_Node* __x) : _List_iterator_base(__x) {}
  _List_iterator() {}
  _List_iterator(const iterator& __x) : _List_iterator_base(__x._M_node) {}

  reference operator*() const { return ((_Node*) _M_node)->_M_data; }

#ifndef __SGI_STL_NO_ARROW_OPERATOR
  pointer operator->() const { return &(operator*()); }
#endif /* __SGI_STL_NO_ARROW_OPERATOR */

  _Self& operator++() {   // 递增使用的是base迭代器的递增函数， 这个是++it
    this->_M_incr();
    return *this;
  }
  _Self operator++(int) {    // 递增使用的是base迭代器的递增函数， 这个是it++，所以我们还是尽量用it++，少了一次拷贝操作
    _Self __tmp = *this;
    this->_M_incr();
    return __tmp;
  }
  _Self& operator--() {   // 递减使用的是base迭代器的递减函数， 这个是--it
    this->_M_decr();
    return *this;
  }
  _Self operator--(int) {  // 递减使用的是base迭代器的递减函数， 这个是it--，同理，尽量使用--it
    _Self __tmp = *this;
    this->_M_decr();
    return __tmp;
  }
};
```
和之前迭代器描述对应，容器都需要定义自己的`iterator_category`函数，以便算法在使用迭代器时，匹配最优的算法：
```Cpp
inline bidirectional_iterator_tag
iterator_category(const _List_iterator_base&)
{
  return bidirectional_iterator_tag();
}
```
`list`的迭代器类型就是`bidirectional_iterator_tag`。

# 数据结构
从上面的源码可以看出，`list`是一个双向链表，但是需要注意，**`list`是一个环状双向链表**，因此`clear`函数只需要使用next指针不断迭代，就可以将除了this的节点都析构和释放内存。
![image](https://github.com/user-attachments/assets/153cbaf3-5222-47c4-8bc7-b4a7d4a48c30)

从`begin`和`end`来看，list的当前节点永远是不用于存储用户数据的，从上图也能看出来：
```Cpp
  iterator begin()             { return (_Node*)(_M_node->_M_next); } // begin是this节点的下一个节点
  const_iterator begin() const { return (_Node*)(_M_node->_M_next); }

  iterator end()             { return _M_node; } // end就是当前节点
  const_iterator end() const { return _M_node; }
```
根据这个特性，判断节点是否为空，只需要判断this的next节点指向的是不是自己即可：
```Cpp
  bool empty() const { return _M_node->_M_next == _M_node; }
```
list的头节点和尾节点也是根据begin和end来获取：
```Cpp
  reference front() { return *begin(); }
  const_reference front() const { return *begin(); }
  reference back() { return *(--end()); }
  const_reference back() const { return *(--end()); }
```

## list构造
list的构造实际上委托的基函数_List_base进行构造：
```Cpp
explicit list(const allocator_type& __a = allocator_type()) : _Base(__a) {}
```
其中的_Base就是_List_base，`typedef _List_base<_Tp, _Alloc> _Base;`：
```Cpp
_List_base(const allocator_type&) {
    _M_node = _M_get_node();
    _M_node->_M_next = _M_node; // 初始化next和prev都指向哨兵
    _M_node->_M_prev = _M_node;
  }
```
_List_base的构造，使用``_M_get_node`，``_M_get_node`内部使用二级内存分配器分配一个元素的大小，作为哨兵：
```Cpp
_List_node<_Tp>* _M_get_node() { return _Alloc_type::allocate(1); }
```



## 插入
`list`的插入有几种重载：在指定位置插入一个节点、在指定位置插入多个数据（可能是指针，也可能是迭代器，或者是n个一样的数据），但是由于list的特性，实际上所有的insert都会调用指定位置插入一个节点的方法，因此我们只看中一个：
```Cpp
  iterator insert(iterator __position, const _Tp& __x) {
    _Node* __tmp = _M_create_node(__x);  // 内部会申请内存，并构造
    __tmp->_M_next = __position._M_node;  // 这就是链表的基本操作了，临时节点构造好后，next指向要插入节点
    __tmp->_M_prev = __position._M_node->_M_prev; // 双向链表，临时节点的prev指向要插入位置的前一个
    __position._M_node->_M_prev->_M_next = __tmp; // 然后让要插入位置前一个节点的next指向临时节点
    __position._M_node->_M_prev = __tmp; // 插入位置的节点的prev指向临时节点
    return __tmp;
  }
```
具体操作可以参考图：
![image](https://github.com/user-attachments/assets/97db2888-3e4c-4ec7-9d3b-fc0a725d6502)

## push_front, push_back, erase
push操作都是基于insert实现的：
```Cpp
  void push_front(const _Tp& __x) { insert(begin(), __x); }
  void push_front() {insert(begin());}
  void push_back(const _Tp& __x) { insert(end(), __x); }
  void push_back() {insert(end());}
```
erase的操作也有多个版本：擦除一个，擦除多个，由于list的特性，擦除多个实际上也是多次调用擦除一次：
```Cpp
  iterator erase(iterator __position) {
    _List_node_base* __next_node = __position._M_node->_M_next;  // 取出next和prev
    _List_node_base* __prev_node = __position._M_node->_M_prev;
    _Node* __n = (_Node*) __position._M_node;
    __prev_node->_M_next = __next_node;  // prev的next 指向取出的next
    __next_node->_M_prev = __prev_node; // next的prev指向取出的prev
    _Destroy(&__n->_M_data);  // 析构
    _M_put_node(__n); // 并释放内存
    return iterator((_Node*) __next_node);
  }
 
// erase多个
template <class _Tp, class _Alloc>
typename list<_Tp,_Alloc>::iterator list<_Tp, _Alloc>::erase(iterator __first, 
                                                             iterator __last)
{
  while (__first != __last)
    erase(__first++);
  return __last;
}
```
![image](https://github.com/user-attachments/assets/cc4650ae-3e9d-400d-983d-d2245290d7ba)

## `list`提供了一个叫` transfer`的函数
```Cpp
  void transfer(iterator __position, iterator __first, iterator __last) {
    if (__position != __last) {
      // Remove [first, last) from its old position.
      __last._M_node->_M_prev->_M_next     = __position._M_node;  // step1
      __first._M_node->_M_prev->_M_next    = __last._M_node;  // step2
      __position._M_node->_M_prev->_M_next = __first._M_node;   // step3

      // Splice [first, last) into its new position.
      _List_node_base* __tmp      = __position._M_node->_M_prev;  // red node
      __position._M_node->_M_prev = __last._M_node->_M_prev; // step4
      __last._M_node->_M_prev     = __first._M_node->_M_prev;  // step5
      __first._M_node->_M_prev    = __tmp; // step6
    }
  }
```
` transfer`的目的是将一片区域[first, last)的节点迁移到某个位置，这个位置可能是同一个list的，也可能是另一个list的，我画了一张图表示这个函数的目的，我觉得比《STL 源码剖析》的好理解：
* 最终效果
![image](https://github.com/user-attachments/assets/03981f97-f2ec-4a3f-8202-ef2000baeaff)


* 每一步的演变
![stl_list_transfer drawio](https://github.com/user-attachments/assets/14955a64-b439-4977-b168-ea5dc4a8464b)

`transfer`函数是不对用户开放的，但是有基于`transfer`开发的其他api开放给用户。
## splice函数
```Cpp
  void splice(iterator __position, list& __x) {  // 将x接到position之前，x和*this必须不是一个链表
    if (!__x.empty()) 
      this->transfer(__position, __x.begin(), __x.end());
  }
  void splice(iterator __position, list&, iterator __i) {  // 将i所指的元素接合到position之前，此时position和i可以指向一个list
    iterator __j = __i;
    ++__j;
    if (__position == __i || __position == __j) return;
    this->transfer(__position, __i, __j);
  }
  void splice(iterator __position, list&, iterator __first, iterator __last) { // 这个其实就是transfer
    if (__first != __last) 
      this->transfer(__position, __first, __last);
  }
```
splice是拼接的意思，言外之意就是将list、区间拼接到position的链表上。我们先看下使用方法：
```Cpp
std::vector<int> iv {1, 2, 3, 4, 5};
std::list<int> il {iv.begin(), iv.end()};

std::list<int> ilist {0, 2, 99, 3, 4};
auto pos = std::find(ilist .begin(), ilist .end(), 99);
ilist.splice(it, il);  // 0， 2， 1， 2， 3， 4， 5， 99， 3， 4
```

## merge
* merge:
```Cpp
template <class _Tp, class _Alloc>
void list<_Tp, _Alloc>::merge(list<_Tp, _Alloc>& __x)
{
  iterator __first1 = begin();
  iterator __last1 = end();
  iterator __first2 = __x.begin();
  iterator __last2 = __x.end();
  while (__first1 != __last1 && __first2 != __last2)
    if (*__first2 < *__first1) { // 找到小于list1的值
      iterator __next = __first2;
      transfer(__first1, __first2, ++__next); // 将小于first1的值合并到first1之前
      __first2 = __next;
    }
    else
      ++__first1;
  if (__first2 != __last2) transfer(__last1, __first2, __last2);
}
```
可以看出，使用merge的两个list必须是有序递增的，merge把list2的元素合并到list1上，其中合并操作使用的就是transfer。

## reverse
reverse函数利用了list双向链表的特点，从哨兵开始，分别交换哨兵的prev和next，然后哨兵向右（原来的next，也就是交换后的prev），继续交换prev和next，知道所有节点都交换完成。为了方便演示，我把next指针用红色箭头表示，prev用绿色箭头表示，我们看图:
![stl_list_reverse drawio](https://github.com/user-attachments/assets/19250feb-b428-485f-81b0-3493f1201bce)

## sort
由于STL的sort只接受random access iterator的容器，因此list无法使用STL的sort，需要定制化：
```Cpp
template <class _Tp, class _Alloc>
void list<_Tp, _Alloc>::sort()
{
  // Do nothing if the list has length 0 or 1.
  if (_M_node->_M_next != _M_node && _M_node->_M_next->_M_next != _M_node) {  // 没有元素或者只有一个元素，就默认满足条件
    list<_Tp, _Alloc> __carry; // 临时链表，排序过程中暂存元素
    list<_Tp, _Alloc> __counter[64];  // 在归并排序过程中存储不同长度的有序链表
    int __fill = 0;  // 表示counter数组中已有的链表数量
    while (!empty()) {
      __carry.splice(__carry.begin(), *this, begin());
      int __i = 0;
      while(__i < __fill && !__counter[__i].empty()) {
        __counter[__i].merge(__carry);
        __carry.swap(__counter[__i++]);
      }
      __carry.swap(__counter[__i]);         
      if (__i == __fill) ++__fill;
    } 

    for (int __i = 1; __i < __fill; ++__i)
      __counter[__i].merge(__counter[__i-1]);
    swap(__counter[__fill-1]);
  }
}
```
list的sort使用的是归并排序算法，TODO

[source issue](https://github.com/quinnwencn/blog/issues/91)
