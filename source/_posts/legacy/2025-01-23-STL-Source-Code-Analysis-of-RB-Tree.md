---
title: "[STL] Source Code Analysis of RB-Tree"
date: 2025-01-23 00:00:00
tags:
  - "C/C++"
  - "STL"
  - "SGI"
categories:
  - "Systems C++"
---

# 节点定义
关于红黑树和二叉树的原理，可以参考这个[Binary Tree](https://github.com/quinnwencn/blog/issues/96), STL中实现了`stl_tree.h`，里面是红黑树的实现。红黑树具有左右子树，值以及节点颜色这几个成员，STL在这几个基础上，还增加了parent指针，只想节点的父节点，从而实现更好的旋转以及平衡操作：
```Cpp
typedef bool _Rb_tree_Color_type;
const _Rb_tree_Color_type _S_rb_tree_red = false;
const _Rb_tree_Color_type _S_rb_tree_black = true;

struct _Rb_tree_node_base
{
  typedef _Rb_tree_Color_type _Color_type;
  typedef _Rb_tree_node_base* _Base_ptr;

  _Color_type _M_color;   // 节点颜色
  _Base_ptr _M_parent;    // RB树的许多操作必须知道父节点
  _Base_ptr _M_left;      // 指向左节点
  _Base_ptr _M_right;     // 指向右节点

  // 查找最大最小的极值是很好找的，因为RG-tree也是一个二叉搜索树
  static _Base_ptr _S_minimum(_Base_ptr __x)
  {
    while (__x->_M_left != 0) __x = __x->_M_left;
    return __x;
  }

  static _Base_ptr _S_maximum(_Base_ptr __x)
  {
    while (__x->_M_right != 0) __x = __x->_M_right;
    return __x;
  }
};
```
上述是红黑树节点的定义，从`minimum`和`maximum`的操作来看，红黑树非常容易取得极值，但是这两个函数没有判断x是否为空，应该有其他地方保证在调用前是非空了。

红黑树的节点分为两层，上述源码是第一层定义，没有包含元素类型，第二层采用模板方式定义了元素类型：
```Cpp
template <class _Value>
struct _Rb_tree_node : public _Rb_tree_node_base
{
  typedef _Rb_tree_node<_Value>* _Link_type;
  _Value _M_value_field;   // 节点值
};
```

# 迭代器定义
二叉树的迭代器都是bidirectional iterator，增加1时，是到右子树的最左的一个左节点，减少1时，是到左子树的最右的一个节点：
```Cpp
struct _Rb_tree_base_iterator
{
  typedef _Rb_tree_node_base::_Base_ptr _Base_ptr;
  typedef bidirectional_iterator_tag iterator_category;
  typedef ptrdiff_t difference_type;
  _Base_ptr _M_node;

  void _M_increment()
  {
    if (_M_node->_M_right != 0) {  // 有右子树，那就找右子树的最左边的
      _M_node = _M_node->_M_right;
      while (_M_node->_M_left != 0)
        _M_node = _M_node->_M_left;  // 找到右子树的最左边的节点
    }
    else { 
      _Base_ptr __y = _M_node->_M_parent;  // 没有右子节点，获取当前节点的父节点
      while (_M_node == __y->_M_right) {  // 如果当前节点已经是右节点，那么父节点会比当前节点小，因此，要不断上溯，直到找到一个父节点，当前节点不是父节点的右节点
        _M_node = __y;
        __y = __y->_M_parent;
      }
      if (_M_node->_M_right != __y) // 当前节点不是父节点的右节点时，那么这个父节点就是比当前节点大的最小值
        _M_node = __y; // 令当前节点，等于当前节点的父节点，就满足了increment
    }
  }

  void _M_decrement()
  {
// 由于stl的红黑树用了一个dummy节点作为哨兵节点，并且根节点）的parent指向这个dummy指点，dummy节点的left指向树中最小的节点，right指向树的最大节点，因此很容易得出begin和end，所以要判断节点是不是根节点，只能用node->parent->parent == node 来判断是不是在dummy节点，dummy节点的颜色是红色的
    if (_M_node->_M_color == _S_rb_tree_red &&
        _M_node->_M_parent->_M_parent == _M_node) 
      _M_node = _M_node->_M_right; // dummy节点的right就是书中最大的节点
    else if (_M_node->_M_left != 0) {  // ok，当前节点不是dummy节点，如果当前节点有左子树，那么当前节点decrement就是左子树中最大的值
      _Base_ptr __y = _M_node->_M_left; // 取得左子树
      while (__y->_M_right != 0)  //取得左子树的最大值
        __y = __y->_M_right;
      _M_node = __y;
    }
    else {  // 不是dummy节点，也没有左子树，那就一直找到不是左子树的节点，那个节点就刚好比当前节点小一点
      _Base_ptr __y = _M_node->_M_parent; // 取得父节点
      while (_M_node == __y->_M_left) {  // 如果当前节点是父节点的左子节点，继续向上找
        _M_node = __y;
        __y = __y->_M_parent;
      }
      _M_node = __y;  // 到这里，找到的已经不是左子树了，最差条件下就是到了根节点
    }
  }
};
```
这里需要注意的是，STL的红黑树用了一个dummy节点作哨兵，并且标注为红色。所有基于红黑树的容器，如set、map都遵循红黑树的特点，迭代器也需要提供operator++(), operator++(int), operator--(), operator--(int)的操作，这些操作都是基于base 迭代器的increment和decrement完成的。
## increment
我们先看increment，increment有两种情况：
* 当前节点有右子树
此时，找到右子树的最小的值，也就是右子树里，左子树的左节点，作为当前节点的increment结果，此时，能保证这个节点是比当前节点大的最小节点
* 当前节点没有右子树
此时有两种可能，一个是当前节点是父节点的左子节点，此时，父节点就是increment的下一个节点；另一种是当前节点是父节点的右子节点，那么因为右子节点比父节点要大，只能继续向前，找到不是父节点的右子节点的节点，此时的父节点就是当前节点的increment的下一个节点
忽略红黑树的颜色，我们可以参考下图：
![Image](https://github.com/user-attachments/assets/3bbae239-ceb8-47d0-89c3-66150be596f4)

## decrement
需要补充一点，STL中的红黑树，增加了一个哨兵节点，染成红色，我们管他叫dummy节点，根节点的parent指向dummy节点，dummy节点的left指针指向树中的最小值，dummy节点的right指针指向树中的最大值。迭代器的end实际上就是dummy节点，因此end减去1其实就是到了dummy节点的right指针指向的节点。因此，decrement时有三种情况：
1. 当前节点位于dummy节点，也就是迭代器的end
此时是end，因此减一到树的最大值，即dummy节点的right节点即可，需要注意的是，为了判断是否位于dummy节点，stl的判断方式是`_M_node->_M_color == _S_rb_tree_red && _M_node->_M_parent->_M_parent == _M_node`，这是因为STL中的dummy节点的parent节点指向了红黑树的根节点，而红黑树的根节点的parent也指向了dummy节点。但是，由于红黑树的根节点必须是黑色，因此我们可以根据节点是红色，并且节点的父节点的父节点是自己，来判断是不是dummy节点；同理，根节点的判断就是`_M_node->_M_color == _S_rb_tree_black && _M_node->_M_parent->_M_parent == _M_node`.
2. 当前节点有左子节点
此时当前迭代器减一，实际上就是取左子树中的最大节点，也就是左子树的最右侧节点
3. 当前节点没有左子树，此时又有两种情形：
   *  当前节点是父节点的右节点：此时decrement实际上就是父节点
   *  当前节点是父节点的左子节点：向上查找，找到第一个不是父节点的左子节点，就是当前子树的是父节点的右子树，此时的父节点就是目标值
   
![Image](https://github.com/user-attachments/assets/89d07331-403a-4230-93a5-e0b8fa8c65e1)

红黑树的迭代器也是使用了两层类实现，上述实现的是base iterator，实际的iterator基于上述的base iterator，实现了operator++和operator--等：
```Cpp
template <class _Value, class _Ref, class _Ptr>
struct _Rb_tree_iterator : public _Rb_tree_base_iterator
{
  typedef _Value value_type;
  typedef _Ref reference;
  typedef _Ptr pointer;
  typedef _Rb_tree_iterator<_Value, _Value&, _Value*>             
    iterator;
  typedef _Rb_tree_iterator<_Value, const _Value&, const _Value*> 
    const_iterator;
  typedef _Rb_tree_iterator<_Value, _Ref, _Ptr>                   
    _Self;
  typedef _Rb_tree_node<_Value>* _Link_type;

  _Rb_tree_iterator() {}
  _Rb_tree_iterator(_Link_type __x) { _M_node = __x; }
  _Rb_tree_iterator(const iterator& __it) { _M_node = __it._M_node; }

  reference operator*() const { return _Link_type(_M_node)->_M_value_field; }
#ifndef __SGI_STL_NO_ARROW_OPERATOR
  pointer operator->() const { return &(operator*()); }
#endif /* __SGI_STL_NO_ARROW_OPERATOR */

  _Self& operator++() { _M_increment(); return *this; }
  _Self operator++(int) {
    _Self __tmp = *this;
    _M_increment();
    return __tmp;
  }
    
  _Self& operator--() { _M_decrement(); return *this; }
  _Self operator--(int) {
    _Self __tmp = *this;
    _M_decrement();
    return __tmp;
  }
};
```

# 红黑树定义
红黑树的定义同样采用两层结构，第一层是base，只定义了基本的节点成员以及成员的构造和西沟函数：
```Cpp
template <class _Tp, class _Alloc>
struct _Rb_tree_base
{
  typedef _Alloc allocator_type;
  allocator_type get_allocator() const { return allocator_type(); }

  _Rb_tree_base(const allocator_type&) 
    : _M_header(0) { _M_header = _M_get_node(); }
  ~_Rb_tree_base() { _M_put_node(_M_header); }

protected:
  _Rb_tree_node<_Tp>* _M_header;

  typedef simple_alloc<_Rb_tree_node<_Tp>, _Alloc> _Alloc_type;

  _Rb_tree_node<_Tp>* _M_get_node()
    { return _Alloc_type::allocate(1); }
  void _M_put_node(_Rb_tree_node<_Tp>* __p)
    { _Alloc_type::deallocate(__p, 1); }
};
```
第二层才是真正的红黑树定义，其他使用红黑树作为底层存储的容器，都是用这一层的定义：
```Cpp
template <class _Key, class _Value, class _KeyOfValue, class _Compare,
          class _Alloc = __STL_DEFAULT_ALLOCATOR(_Value) >
class _Rb_tree : protected _Rb_tree_base<_Value, _Alloc> {
  typedef _Rb_tree_base<_Value, _Alloc> _Base;
protected:
  typedef _Rb_tree_node_base* _Base_ptr;
  typedef _Rb_tree_node<_Value> _Rb_tree_node;
  typedef _Rb_tree_Color_type _Color_type;
public:
  typedef _Key key_type;
  typedef _Value value_type;
  typedef value_type* pointer;
  typedef const value_type* const_pointer;
  typedef value_type& reference;
  typedef const value_type& const_reference;
  typedef _Rb_tree_node* _Link_type;
  typedef size_t size_type;
  typedef ptrdiff_t difference_type;

  typedef typename _Base::allocator_type allocator_type;
  allocator_type get_allocator() const { return _Base::get_allocator(); }

protected:
#ifdef __STL_USE_NAMESPACES
  using _Base::_M_get_node;
  using _Base::_M_put_node;
  using _Base::_M_header;
#endif /* __STL_USE_NAMESPACES */

protected:

  _Link_type _M_create_node(const value_type& __x)
  {
    _Link_type __tmp = _M_get_node();  // 使用base的方式申请内存，实际上使用的仍然是次级内存分配器
    __STL_TRY {
      construct(&__tmp->_M_value_field, __x);
    }
    __STL_UNWIND(_M_put_node(__tmp));
    return __tmp;
  }

  _Link_type _M_clone_node(_Link_type __x)
  {
    _Link_type __tmp = _M_create_node(__x->_M_value_field);
    __tmp->_M_color = __x->_M_color;
    __tmp->_M_left = 0;
    __tmp->_M_right = 0;
    return __tmp;
  }

  void destroy_node(_Link_type __p)
  {
    destroy(&__p->_M_value_field);
    _M_put_node(__p);
  }

protected:
  size_type _M_node_count; // keeps track of size of tree
  _Compare _M_key_compare;

  _Link_type& _M_root() const 
    { return (_Link_type&) _M_header->_M_parent; }
  _Link_type& _M_leftmost() const 
    { return (_Link_type&) _M_header->_M_left; }
  _Link_type& _M_rightmost() const 
    { return (_Link_type&) _M_header->_M_right; }

  static _Link_type& _S_left(_Link_type __x)
    { return (_Link_type&)(__x->_M_left); }
  static _Link_type& _S_right(_Link_type __x)
    { return (_Link_type&)(__x->_M_right); }
  static _Link_type& _S_parent(_Link_type __x)
    { return (_Link_type&)(__x->_M_parent); }
  static reference _S_value(_Link_type __x)
    { return __x->_M_value_field; }
  static const _Key& _S_key(_Link_type __x)
    { return _KeyOfValue()(_S_value(__x)); }
  static _Color_type& _S_color(_Link_type __x)
    { return (_Color_type&)(__x->_M_color); }

  static _Link_type& _S_left(_Base_ptr __x)
    { return (_Link_type&)(__x->_M_left); }
  static _Link_type& _S_right(_Base_ptr __x)
    { return (_Link_type&)(__x->_M_right); }
  static _Link_type& _S_parent(_Base_ptr __x)
    { return (_Link_type&)(__x->_M_parent); }
  static reference _S_value(_Base_ptr __x)
    { return ((_Link_type)__x)->_M_value_field; }
  static const _Key& _S_key(_Base_ptr __x)
    { return _KeyOfValue()(_S_value(_Link_type(__x)));} 
  static _Color_type& _S_color(_Base_ptr __x)
    { return (_Color_type&)(_Link_type(__x)->_M_color); }

  static _Link_type _S_minimum(_Link_type __x) 
    { return (_Link_type)  _Rb_tree_node_base::_S_minimum(__x); }

  static _Link_type _S_maximum(_Link_type __x)
    { return (_Link_type) _Rb_tree_node_base::_S_maximum(__x); }

public:
  typedef _Rb_tree_iterator<value_type, reference, pointer> iterator;
  typedef _Rb_tree_iterator<value_type, const_reference, const_pointer> 
          const_iterator;

#ifdef __STL_CLASS_PARTIAL_SPECIALIZATION
  typedef reverse_iterator<const_iterator> const_reverse_iterator;
  typedef reverse_iterator<iterator> reverse_iterator;
#else /* __STL_CLASS_PARTIAL_SPECIALIZATION */
  typedef reverse_bidirectional_iterator<iterator, value_type, reference,
                                         difference_type>
          reverse_iterator; 
  typedef reverse_bidirectional_iterator<const_iterator, value_type,
                                         const_reference, difference_type>
          const_reverse_iterator;
#endif /* __STL_CLASS_PARTIAL_SPECIALIZATION */ 

private:
  iterator _M_insert(_Base_ptr __x, _Base_ptr __y, const value_type& __v);
  _Link_type _M_copy(_Link_type __x, _Link_type __p);
  void _M_erase(_Link_type __x);

public:
                                // allocation/deallocation
  _Rb_tree()
    : _Base(allocator_type()), _M_node_count(0), _M_key_compare()   // 此时只申请了一个节点，即dummy节点
    { _M_empty_initialize(); }  // empty initialize就是初始化dummy节点，颜色为红色

  _Rb_tree(const _Compare& __comp)
    : _Base(allocator_type()), _M_node_count(0), _M_key_compare(__comp) 
    { _M_empty_initialize(); }

  _Rb_tree(const _Compare& __comp, const allocator_type& __a)
    : _Base(__a), _M_node_count(0), _M_key_compare(__comp) 
    { _M_empty_initialize(); }

  _Rb_tree(const _Rb_tree<_Key,_Value,_KeyOfValue,_Compare,_Alloc>& __x)   // 拷贝构造函数
    : _Base(__x.get_allocator()),
      _M_node_count(0), _M_key_compare(__x._M_key_compare)
  { 
    if (__x._M_root() == 0)
      _M_empty_initialize();
    else {
      _S_color(_M_header) = _S_rb_tree_red;   // 初始化dummy节点的颜色
      _M_root() = _M_copy(__x._M_root(), _M_header);  // 深拷贝红黑树，需要每个节点进行构造，并拷贝
      _M_leftmost() = _S_minimum(_M_root());  // 更新最小值和最大值
      _M_rightmost() = _S_maximum(_M_root());
    }
    _M_node_count = __x._M_node_count;
  }
  ~_Rb_tree() { clear(); } // 析构
  _Rb_tree<_Key,_Value,_KeyOfValue,_Compare,_Alloc>& 
  operator=(const _Rb_tree<_Key,_Value,_KeyOfValue,_Compare,_Alloc>& __x);

private:
  void _M_empty_initialize() {
    _S_color(_M_header) = _S_rb_tree_red; // used to distinguish header from 
                                          // __root, in iterator.operator++
    _M_root() = 0;
    _M_leftmost() = _M_header;  // 空树时，最小值和最大值都指向dummy节点
    _M_rightmost() = _M_header;
  }

public:    
                                // accessors:
  _Compare key_comp() const { return _M_key_compare; }
  iterator begin() { return _M_leftmost(); }
  const_iterator begin() const { return _M_leftmost(); }
  iterator end() { return _M_header; }
  const_iterator end() const { return _M_header; }
  reverse_iterator rbegin() { return reverse_iterator(end()); }
  const_reverse_iterator rbegin() const { 
    return const_reverse_iterator(end()); 
  }
  reverse_iterator rend() { return reverse_iterator(begin()); }
  const_reverse_iterator rend() const { 
    return const_reverse_iterator(begin());
  } 
  bool empty() const { return _M_node_count == 0; }
  size_type size() const { return _M_node_count; }
  size_type max_size() const { return size_type(-1); }

  void swap(_Rb_tree<_Key,_Value,_KeyOfValue,_Compare,_Alloc>& __t) {
    __STD::swap(_M_header, __t._M_header);
    __STD::swap(_M_node_count, __t._M_node_count);
    __STD::swap(_M_key_compare, __t._M_key_compare);
  }
    
public:
                                // insert/erase
  pair<iterator,bool> insert_unique(const value_type& __x);
  iterator insert_equal(const value_type& __x);

  // 将x插入到RB-tree中（保持节点值独一无二），用于map
  iterator insert_unique(iterator __position, const value_type& __x);
  // 将x插入到RB-tree中（允许节点重复）， 用于multiple_map
  iterator insert_equal(iterator __position, const value_type& __x);

#ifdef __STL_MEMBER_TEMPLATES  
  template <class _InputIterator>
  void insert_unique(_InputIterator __first, _InputIterator __last);
  template <class _InputIterator>
  void insert_equal(_InputIterator __first, _InputIterator __last);
#else /* __STL_MEMBER_TEMPLATES */
  void insert_unique(const_iterator __first, const_iterator __last);
  void insert_unique(const value_type* __first, const value_type* __last);
  void insert_equal(const_iterator __first, const_iterator __last);
  void insert_equal(const value_type* __first, const value_type* __last);
#endif /* __STL_MEMBER_TEMPLATES */

  void erase(iterator __position);
  size_type erase(const key_type& __x);
  void erase(iterator __first, iterator __last);
  void erase(const key_type* __first, const key_type* __last);
  void clear() {
    if (_M_node_count != 0) {
      _M_erase(_M_root());
      _M_leftmost() = _M_header;
      _M_root() = 0;
      _M_rightmost() = _M_header;
      _M_node_count = 0;
    }
  }      

public:
                                // set operations:
  iterator find(const key_type& __x);
  const_iterator find(const key_type& __x) const;
  size_type count(const key_type& __x) const;
  iterator lower_bound(const key_type& __x);
  const_iterator lower_bound(const key_type& __x) const;
  iterator upper_bound(const key_type& __x);
  const_iterator upper_bound(const key_type& __x) const;
  pair<iterator,iterator> equal_range(const key_type& __x);
  pair<const_iterator, const_iterator> equal_range(const key_type& __x) const;

public:
                                // Debugging.
  bool __rb_verify() const;
};
```

拷贝构造的实现：
```Cpp
template <class _Key, class _Val, class _KoV, class _Compare, class _Alloc>
typename _Rb_tree<_Key, _Val, _KoV, _Compare, _Alloc>::_Link_type 
_Rb_tree<_Key,_Val,_KoV,_Compare,_Alloc>
  ::_M_copy(_Link_type __x, _Link_type __p)
{
                        // structural copy.  __x and __p must be non-null.
  _Link_type __top = _M_clone_node(__x);  // 申请真正的根节点
  __top->_M_parent = __p; // 根节点的parent指向dummy节点
 
  __STL_TRY {
    if (__x->_M_right) // 右节点不为空
      __top->_M_right = _M_copy(_S_right(__x), __top);  // 递归拷贝右节点
    __p = __top; // top是root，因此我们使用p来充当current节点
    __x = _S_left(__x); 

    while (__x != 0) {
      _Link_type __y = _M_clone_node(__x);  // 如果左节点不为空，拷贝左节点
      __p->_M_left = __y;  // 更新current节点的左子节点
      __y->_M_parent = __p; // 左子节点指向父节点
      if (__x->_M_right)
        __y->_M_right = _M_copy(_S_right(__x), __y); // 递归处理左子节点的右子节点
      __p = __y;
      __x = _S_left(__x);
    }
  }
  __STL_UNWIND(_M_erase(__top));

  return __top;
}
```

## 红黑树插入元素
STL提供了map和multiple_map， 以及set和multiple_set两种不同的容器，底层都是红黑树，区别在于是否可以插入重复元素，因此红黑树必须提供插入相同元素和不同元素的功能。

### 允许插入相同元素
```Cpp
// 插入新值：节点键值允许重复
// 返回值是一个指向新增节点的迭代器。
template <class _Key, class _Value, class _KeyOfValue, 
          class _Compare, class _Alloc>
typename _Rb_tree<_Key,_Value,_KeyOfValue,_Compare,_Alloc>::iterator
_Rb_tree<_Key,_Value,_KeyOfValue,_Compare,_Alloc>
  ::insert_equal(const _Value& __v)
{
  _Link_type __y = _M_header;
  _Link_type __x = _M_root();
  while (__x != 0) {
    __y = __x;
    __x = _M_key_compare(_KeyOfValue()(__v), _S_key(__x)) ? 
            _S_left(__x) : _S_right(__x);
  }
  // __x是新插入点，__y是插入点的父节点，__v是新值
  return _M_insert(__x, __y, __v);
}
```
### 插入唯一元素
```Cpp
template <class _Key, class _Value, class _KeyOfValue, 
          class _Compare, class _Alloc>
pair<typename _Rb_tree<_Key,_Value,_KeyOfValue,_Compare,_Alloc>::iterator, 
     bool>
_Rb_tree<_Key,_Value,_KeyOfValue,_Compare,_Alloc>
  ::insert_unique(const _Value& __v)
{
  _Link_type __y = _M_header;
  _Link_type __x = _M_root();  // find from root
  bool __comp = true;
  while (__x != 0) {
    __y = __x;
    __comp = _M_key_compare(_KeyOfValue()(__v), _S_key(__x)); // v的值是否小于x节点的值
    __x = __comp ? _S_left(__x) : _S_right(__x);  // comp为true表示小于，到左子树里查找；大于则从右子树查找
  }
  iterator __j = iterator(__y);   // 把__j作为插入节点的父节点
  // 如果__comp = true，表示将插入左侧
  if (__comp)
    if (__j == begin())    // 表示插入节点的父节点是最左节点 
      return pair<iterator,bool>(_M_insert(__x, __y, __v), true);
    else
      --__j;
  // 小于新值，将在右侧插入。
  if (_M_key_compare(_S_key(__j._M_node), _KeyOfValue()(__v)))
    return pair<iterator,bool>(_M_insert(__x, __y, __v), true);
  // 此处表示新值一定与树中的键值重复，那么就不插入新值。
  return pair<iterator,bool>(__j, false);
}
```

可以看出，不管是允许插入相同元素，还是不允许插入相同元素，最后都是使用`_M_insert`完成插入操作，这个函数的实现如下：
```Cpp
template <class _Key, class _Value, class _KeyOfValue, 
          class _Compare, class _Alloc>
typename _Rb_tree<_Key,_Value,_KeyOfValue,_Compare,_Alloc>::iterator
_Rb_tree<_Key,_Value,_KeyOfValue,_Compare,_Alloc>
  ::_M_insert(_Base_ptr __x_, _Base_ptr __y_, const _Value& __v)
{
    // 参数__x_是新值插入点，__y_是插入点的父节点，__v是要插入的值
  _Link_type __x = (_Link_type) __x_;
  _Link_type __y = (_Link_type) __y_;
  _Link_type __z;

  if (__y == _M_header || __x != 0 || 
      _M_key_compare(_KeyOfValue()(__v), _S_key(__y))) {  // 如果插入位置的父节点是dummy节点，或者插入位置不是父节点且不为空，又或者插入位置不是父节点，插入位置为空，v又比父节点要小
    __z = _M_create_node(__v);  // 创建节点
    _S_left(__y) = __z;               // also makes _M_leftmost() = __z 
                                      //    when __y == _M_header
    if (__y == _M_header) {
      _M_root() = __z; // 如果y是dummy节点，新插入的位置就是root
      _M_rightmost() = __z; // 最大是插入的节点
    }
    else if (__y == _M_leftmost()) // 如果y已经是最小值了，那么新插入的节点肯定是新的最小值
      _M_leftmost() = __z;   // maintain _M_leftmost() pointing to min node
  }
  else {   // y 不是dummy节点，并且x是空指针，v也比y大，难就插入到y的右节点
    __z = _M_create_node(__v);
    _S_right(__y) = __z;
    if (__y == _M_rightmost())  
      _M_rightmost() = __z;  // maintain _M_rightmost() pointing to max node
  }
   // 完成插入后，更新必要信息，并进行红黑树的重平衡
  _S_parent(__z) = __y;
  _S_left(__z) = 0;
  _S_right(__z) = 0;
  _Rb_tree_rebalance(__z, _M_header->_M_parent);
  ++_M_node_count;
  return iterator(__z);
}
```

## 红黑树重调整
二叉搜索树的插入和删除按照搜索二叉树的方式都可以很快完成，如果只是AVL树，那么重平衡也可以按照旋转完成，但是结合上红黑树的着色技巧，那么红黑树的重平衡就变得更复杂了，需要结合旋转和着色完成。STL中，相关的操作在`_Rb_tree_rebalance`：
```Cpp
inline void 
_Rb_tree_rebalance(_Rb_tree_node_base* __x, _Rb_tree_node_base*& __root)
{
  __x->_M_color = _S_rb_tree_red;   // 新节点必须是红色
  while (__x != __root && __x->_M_parent->_M_color == _S_rb_tree_red) {  // 循环修复，到最后如果root也是红色，直接改黑色就行
    if (__x->_M_parent == __x->_M_parent->_M_parent->_M_left) {  // 插入节点的父节点是祖父节点的左子节点
      _Rb_tree_node_base* __y = __x->_M_parent->_M_parent->_M_right;
      if (__y && __y->_M_color == _S_rb_tree_red) {  // 叔叔节点的颜色是红色
        __x->_M_parent->_M_color = _S_rb_tree_black; // 将父节点和叔叔节点的颜色都改成黑色，祖父节点改成红色，然后向上循环修复，直到满足条件或者到root
        __y->_M_color = _S_rb_tree_black;
        __x->_M_parent->_M_parent->_M_color = _S_rb_tree_red;
        __x = __x->_M_parent->_M_parent;
      }
      else {  // 没有叔叔节点或者叔叔节点是黑色
        if (__x == __x->_M_parent->_M_right) { // 如果当前节点是父节点的右节点
          __x = __x->_M_parent;  
          _Rb_tree_rotate_left(__x, __root);  // 对父节点进行左旋
        }
        __x->_M_parent->_M_color = _S_rb_tree_black;  // 将x的父节点改成黑色
        __x->_M_parent->_M_parent->_M_color = _S_rb_tree_red; // 祖父节点改成红色
        _Rb_tree_rotate_right(__x->_M_parent->_M_parent, __root); // 对组父节点进行右旋
      }
    }
    else {  // 父节点是祖父节点的右子节点
      _Rb_tree_node_base* __y = __x->_M_parent->_M_parent->_M_left;
      if (__y && __y->_M_color == _S_rb_tree_red) { // 叔叔节点是红色的话
        __x->_M_parent->_M_color = _S_rb_tree_black;  // 父节点和叔叔节点的颜色改成黑色
        __y->_M_color = _S_rb_tree_black;
        __x->_M_parent->_M_parent->_M_color = _S_rb_tree_red; // 祖父节点改成红色
        __x = __x->_M_parent->_M_parent; // 向上循环修复，和父节点是左子节点的情况类似
      }
      else { // 没有叔叔节点，或者叔叔节点是黑色
        if (__x == __x->_M_parent->_M_left) { // 如果当前节点是父节点的左子节点
          __x = __x->_M_parent;
          _Rb_tree_rotate_right(__x, __root);  // 先对父节点进行右旋
        }
        __x->_M_parent->_M_color = _S_rb_tree_black; // 然后将父节点改成黑色
        __x->_M_parent->_M_parent->_M_color = _S_rb_tree_red; // 将祖父节点改成红色
        _Rb_tree_rotate_left(__x->_M_parent->_M_parent, __root); // 对祖父节点进行左旋
      }
    }
  }
  __root->_M_color = _S_rb_tree_black;   // 根节点永远为黑
}
```
可以看到，红黑树的重平衡只有在父节点是红色才会触发，此时又分为两种情况：
* 父节点是祖父节点的左子节点
此时，根据叔叔节点的颜色，又分为两种情况：
    * 叔叔节点是红色
    重平衡的操作：先将父节点和叔叔节点的颜色改成黑色，祖父节点颜色改成红色，然后循环向上重平衡
![image](https://github.com/user-attachments/assets/8aaa1579-6ec2-4403-a945-d76e2e8e6184)

    * 叔叔节点是黑色（空节点也认为是黑色）
此时，如果当前节点是父节点的右子节点，需要先对父节点进行一次左旋，然后在将父节点改成黑色，祖父节点改成红色，最后再进行一次右旋：
![image](https://github.com/user-attachments/assets/137e77bb-8a03-4288-82fe-e98265ef9068)

* 父节点是祖父节点的右子节点
和父节点是祖父节点的左子节点一样，也根据叔叔节点的颜色分为两种情况
    * 叔叔节点是红色
    * 叔叔节点是黑色（空节点也是黑色）
此时，如果当前节点是父节点的左子节点，需要先对父节点进行一次右旋，然后将父节点改成黑色，祖父节点改成红色，最后进行一次左旋，与上一种情况对应。

### 左旋和右旋
红黑树的左旋和右旋和普通二叉树的并无差别，也没有处理颜色，只是多了个parent指针，需要维护parent指针而已：
```Cpp
inline void 
_Rb_tree_rotate_left(_Rb_tree_node_base* __x, _Rb_tree_node_base*& __root)
{
  _Rb_tree_node_base* __y = __x->_M_right;  // 旋转节点的右子节点会被提升代替旋转节点
  __x->_M_right = __y->_M_left;  // 右子节点的左子树要挂到旋转节点的右子树
  if (__y->_M_left !=0) // 左子树不为空时，还需要维护parent指针
    __y->_M_left->_M_parent = __x;
  __y->_M_parent = __x->_M_parent;  // 如果x是root节点，此时y的parent也指向了dummy节点

  // __y完全代替__x的地位（必须将x对其父节点的关系完全接收过来）
  if (__x == __root)  // 如果旋转节点是root节点，那么旋转节点的右子节点就是新的root节点
    __root = __y;
  else if (__x == __x->_M_parent->_M_left)  // 如果旋转节点是root节点，那么旋转节点的右子节点就是新的root节点
    __x->_M_parent->_M_left = __y;
  else
    __x->_M_parent->_M_right = __y;
  __y->_M_left = __x;
  __x->_M_parent = __y;
}

inline void 
_Rb_tree_rotate_right(_Rb_tree_node_base* __x, _Rb_tree_node_base*& __root)
{
  _Rb_tree_node_base* __y = __x->_M_left;
  __x->_M_left = __y->_M_right;
  if (__y->_M_right != 0)
    __y->_M_right->_M_parent = __x;
  __y->_M_parent = __x->_M_parent;

  if (__x == __root)
    __root = __y;
  else if (__x == __x->_M_parent->_M_right)
    __x->_M_parent->_M_right = __y;
  else
    __x->_M_parent->_M_left = __y;
  __y->_M_right = __x;
  __x->_M_parent = __y;
}
```

### 红黑树的查找
红黑树其实也是二叉搜索树，因此查找和二叉搜索树没区别：
```Cpp
emplate <class _Key, class _Value, class _KeyOfValue, 
          class _Compare, class _Alloc>
typename _Rb_tree<_Key,_Value,_KeyOfValue,_Compare,_Alloc>::iterator 
_Rb_tree<_Key,_Value,_KeyOfValue,_Compare,_Alloc>::find(const _Key& __k)
{
  _Link_type __y = _M_header;      // Last node which is not less than __k. 
  _Link_type __x = _M_root();      // Current node. 

  while (__x != 0) 
      // __x > __k 就想左，否则向右
    if (!_M_key_compare(_S_key(__x), __k))
      __y = __x, __x = _S_left(__x); 
    else
      __x = _S_right(__x);

  iterator __j = iterator(__y);   
  return (__j == end() || _M_key_compare(__k, _S_key(__j._M_node))) ? 
     end() : __j;
}
```

[source issue](https://github.com/quinnwencn/blog/issues/100)
