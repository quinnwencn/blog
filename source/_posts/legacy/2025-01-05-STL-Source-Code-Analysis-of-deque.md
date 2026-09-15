---
title: "[STL] Source Code Analysis of deque"
date: 2025-01-05 00:00:00
tags:
  - "C/C++"
  - "STL"
  - "SGI"
categories:
  - "Systems C++"
---

`vector`是一个单项开口的连续线性空间，而`deque`是一个双向开口的连续线性空间：
![image](https://github.com/user-attachments/assets/cb062d7b-71c5-482e-b300-936b3e2fe407)

由于是双向开口，`deque`在头部的插入操作也是常数时间完成，这比`vector`头部插入更高效。同时，`deque`也提供了random access iterator，但是比vector的更复杂。为了实现双向开口，`deque`使用了一个映射快，将每一片线性空间映射到映射块中，代码里把这个映射快叫做map（不是STL的map）。

# 源码
和其他容器一样，`deque`同样是有一个`_Deque_base`：
```Cpp
template <class _Tp, class _Alloc>
class _Deque_base {
public:
  typedef _Deque_iterator<_Tp,_Tp&,_Tp*>             iterator;
  typedef _Deque_iterator<_Tp,const _Tp&,const _Tp*> const_iterator;

  typedef _Alloc allocator_type;
  allocator_type get_allocator() const { return allocator_type(); }

  _Deque_base(const allocator_type&, size_t __num_elements)
    : _M_map(0), _M_map_size(0),  _M_start(), _M_finish() {
    _M_initialize_map(__num_elements);
  }
  _Deque_base(const allocator_type&)
    : _M_map(0), _M_map_size(0),  _M_start(), _M_finish() {}
  ~_Deque_base();    

protected:
  void _M_initialize_map(size_t);
  void _M_create_nodes(_Tp** __nstart, _Tp** __nfinish);
  void _M_destroy_nodes(_Tp** __nstart, _Tp** __nfinish);
  enum { _S_initial_map_size = 8 };

protected:
  _Tp** _M_map; // map实际上是一个指向指针的指针
  size_t _M_map_size;  
  iterator _M_start;
  iterator _M_finish;

  typedef simple_alloc<_Tp, _Alloc>  _Node_alloc_type;
  typedef simple_alloc<_Tp*, _Alloc> _Map_alloc_type;

  _Tp* _M_allocate_node()
    { return _Node_alloc_type::allocate(__deque_buf_size(sizeof(_Tp))); }
  void _M_deallocate_node(_Tp* __p)
    { _Node_alloc_type::deallocate(__p, __deque_buf_size(sizeof(_Tp))); }
  _Tp** _M_allocate_map(size_t __n) 
    { return _Map_alloc_type::allocate(__n); }
  void _M_deallocate_map(_Tp** __p, size_t __n) 
    { _Map_alloc_type::deallocate(__p, __n); }
};
```
其中的成员：
* `_M_map`是一个指向指针的指针，
* `_M_map_size`记录着map的大小，也就是指针数组的大小
* `_M_start`和`_M_finish`是迭代器

我们展开看看`deque`的迭代器：
```Cpp
template <class _Tp, class _Ref, class _Ptr>
struct _Deque_iterator {
  typedef _Deque_iterator<_Tp, _Tp&, _Tp*>             iterator;
  typedef _Deque_iterator<_Tp, const _Tp&, const _Tp*> const_iterator;
  static size_t _S_buffer_size() { return __deque_buf_size(sizeof(_Tp)); }

  typedef random_access_iterator_tag iterator_category;
// 因为没有继承自std::iterator，以下五个类型别名需要自定义
  typedef _Tp value_type;
  typedef _Ptr pointer;
  typedef _Ref reference;
  typedef size_t size_type;
  typedef ptrdiff_t difference_type;
  typedef _Tp** _Map_pointer;

  typedef _Deque_iterator _Self;

 // 用于保持与容器的关系
  _Tp* _M_cur;   // 指向当前内存片的current
  _Tp* _M_first;  // 指向当前内存片的起始地址
  _Tp* _M_last;   // 指向当前内存片的末尾地址
  _Map_pointer _M_node;   // 指向deque的控制中心

 // 。。。
```
从迭代器的定义可以看到，`deque`的迭代器定义为random access iterator，没有继承自`std::iterator`，因此自定义了迭代器要求的五个类型别名。由于`deque`是使用map执行一片片内存，因此需要一个迭代器用于维护这篇内存的current位置，起始位置和终止位置，也就是迭代器中的`_M_cur`, `_M_first`, 和`_M_finish`， 最后还有一个`_M_node`指向map数组，也就是控制中心。
迭代器中有一个静态方法：`static size_t _S_buffer_size() { return __deque_buf_size(sizeof(_Tp)); }`，这意味着`deque`的内存片的大小只与存储的类型有关，计算方法如下：
```Cpp
// Note: this function is simply a kludge to work around several compilers'
//  bugs in handling constant expressions.
inline size_t __deque_buf_size(size_t __size) {
  return __size < 512 ? size_t(512 / __size) : size_t(1);
}
```
如果元素的大小大于512字节，`deque`就退化成链表了。下图可以表示控制数组和内存片的关系：
![image](https://github.com/user-attachments/assets/cbeb08ed-cb0c-4e5f-b5a3-51e630a891e5)

## 迭代器的几个关键操作
由于每个内存片的大小有限，常见的递增、递减都可能会跨越内存片，  因此迭代器需要维护在同一片内存片以及跨片的可能性。
### `_M_set_node`
`_M_set_node`主要用于在跨片时，更新first、last和node：
```Cpp
  void _M_set_node(_Map_pointer __new_node) {
    _M_node = __new_node;
    _M_first = *__new_node;
    _M_last = _M_first + difference_type(_S_buffer_size());
  }
```

### 自增
```Cpp
  _Self& operator++() { // ++it
    ++_M_cur;
    if (_M_cur == _M_last) {
      _M_set_node(_M_node + 1);
      _M_cur = _M_first;
    }
    return *this; 
  }
  _Self operator++(int)  {  // it++
    _Self __tmp = *this;
    ++*this;
    return __tmp;
  }
```
在（++it)自增时，如果自增后，cur已经到达了内存片的last，那就意味着已经跨越了一篇内存片，此时要调用`_M_set_node`设置迭代器的first、last和node为新的内存片，并且设置cur为更新后的first。

### 自减
```Cpp
  _Self& operator--() {
    if (_M_cur == _M_first) {
      _M_set_node(_M_node - 1);
      _M_cur = _M_last;
    }
    --_M_cur;
    return *this;
  }
  _Self operator--(int) {
    _Self __tmp = *this;
    --*this;
    return __tmp;
  }
```
自减时，如果此时cur处于内存片的起始位置，也就是first，那么也会跨越内存片。

## 加等于
```Cpp
  _Self& operator+=(difference_type __n)
  {
    difference_type __offset = __n + (_M_cur - _M_first);
    if (__offset >= 0 && __offset < difference_type(_S_buffer_size()))  // 仍然处于同一片内存片
      _M_cur += __n;
    else {
     // 此时发生了跨内存片的情况，大于0表示向右胯，小于0表示向左胯，这两种情况都求出跨越的长度，以及方向
      difference_type __node_offset =
        __offset > 0 ? __offset / difference_type(_S_buffer_size())
                   : -difference_type((-__offset - 1) / _S_buffer_size()) - 1;
      _M_set_node(_M_node + __node_offset);  // 然后根据方向进行跨越
      _M_cur = _M_first + 
        (__offset - __node_offset * difference_type(_S_buffer_size()));  // 跨越后偏移长度
    }
    return *this;
  }
```
加等于是一个特别的函数，因为加法和减法都可以基于这个去实现。由于deque的特殊性，加等于同样会产生跨内存片的可能，要么是向右跨，要么是向左跨，跨越的长度也需要记住，详细解析看上述代码注释。

## deque构造函数
```Cpp
  explicit deque(const allocator_type& __a = allocator_type()) 
    : _Base(__a, 0) {}
  deque(const deque& __x) : _Base(__x.get_allocator(), __x.size()) 
    { uninitialized_copy(__x.begin(), __x.end(), _M_start); }
  deque(size_type __n, const value_type& __value,
        const allocator_type& __a = allocator_type()) : _Base(__a, __n)
    { _M_fill_initialize(__value); }
  explicit deque(size_type __n) : _Base(allocator_type(), __n)
    { _M_fill_initialize(value_type()); }
```
可以看到，deque的构造函数都是委托_Base，也就是_Deque_base进行内存申请，然后再将值进行拷贝或者构造， 可以看出，_Deque_base使用`_M_initialize_map`来申请内存：
```Cpp
  _Deque_base(const allocator_type&, size_t __num_elements)
    : _M_map(0), _M_map_size(0),  _M_start(), _M_finish() {
    _M_initialize_map(__num_elements);
  }


template <class _Tp, class _Alloc>
void
_Deque_base<_Tp,_Alloc>::_M_initialize_map(size_t __num_elements)
{
  size_t __num_nodes = 
    __num_elements / __deque_buf_size(sizeof(_Tp)) + 1;  // 需要的节点数 = (元素个数 / 每个内存片可以容纳的元素个数) + 1

  _M_map_size = max((size_t) _S_initial_map_size, __num_nodes + 2); // 一个map要管理的节点数 = max(8, 所需节点数+ 2）；
  _M_map = _M_allocate_map(_M_map_size); // _M_allocate_map实际上使用的时simple_alloc，分配一个map，也就是指针数组

  _Tp** __nstart = _M_map + (_M_map_size - __num_nodes) / 2; // 对于刚分配出来的map，start指向中间
  _Tp** __nfinish = __nstart + __num_nodes;  // finish在申请的节点的末尾，这样使得start和finish指向申请的map的居中位置
    
  __STL_TRY {
    _M_create_nodes(__nstart, __nfinish); // 前面只是分配了map的内存，start到finish的node对应的内存片还没申请呢，这里就是要做申请工作
  }
  __STL_UNWIND((_M_deallocate_map(_M_map, _M_map_size), 
                _M_map = 0, _M_map_size = 0));
  _M_start._M_set_node(__nstart); // 设置deque的start和finish迭代器指向的内存片
  _M_finish._M_set_node(__nfinish - 1);
  _M_start._M_cur = _M_start._M_first;  // 设置deque的start迭代器的cur
  _M_finish._M_cur = _M_finish._M_first +
               __num_elements % __deque_buf_size(sizeof(_Tp));
}


// 为start和finish指向的内存片申请内存
template <class _Tp, class _Alloc>
void _Deque_base<_Tp,_Alloc>::_M_create_nodes(_Tp** __nstart, _Tp** __nfinish)
{
  _Tp** __cur;
  __STL_TRY {
    for (__cur = __nstart; __cur < __nfinish; ++__cur)
      *__cur = _M_allocate_node(); // 实际上就是申请内存片， 每次申请一片内存片
  }
  __STL_UNWIND(_M_destroy_nodes(__nstart, __cur));
}
```

## deque尾部插入
```Cpp
  void push_back(const value_type& __t) {
    if (_M_finish._M_cur != _M_finish._M_last - 1) {
      construct(_M_finish._M_cur, __t);
      ++_M_finish._M_cur;
    }
    else
      _M_push_back_aux(__t);
  }


// Called only if _M_finish._M_cur == _M_finish._M_last - 1.
template <class _Tp, class _Alloc>
void deque<_Tp,_Alloc>::_M_push_back_aux(const value_type& __t)  // 处理特殊情况的push_back
{
  value_type __t_copy = __t;
  _M_reserve_map_at_back(); // 如果当前是map的最后一个node，需要为map扩容
  *(_M_finish._M_node + 1) = _M_allocate_node(); // 在map的finish后新增一个内存片
  __STL_TRY {
    construct(_M_finish._M_cur, __t_copy); // 在当前的内存片的最后一个位置构造插入的元素
    _M_finish._M_set_node(_M_finish._M_node + 1);  // 跨越内存片，更新finish
    _M_finish._M_cur = _M_finish._M_first; // 此时最新的cur位于新内存片的开始
  }
  __STL_UNWIND(_M_deallocate_node(*(_M_finish._M_node + 1)));
}
```
尾部插入时，有两种情况：
* 当前内存片的cur不是最后一个元素：正常在cur构造
* 当前内存片的cur正好是最后一个元素：根据情况挪一挪map的start和finish，然后再申请一个内存片，用于存放新插入的数据。此时可能触发对map扩容，即申请更多内存，将原有map的数据拷贝过去。

现在，我们看看这个`_M_reserve_map_at_back`，这个函数在`push_back_aux`与`push_front_aux`都被用到了：
```Cpp
template <class _Tp, class _Alloc>
void deque<_Tp,_Alloc>::_M_reallocate_map(size_type __nodes_to_add,
                                          bool __add_at_front)
{
  size_type __old_num_nodes = _M_finish._M_node - _M_start._M_node + 1;
  size_type __new_num_nodes = __old_num_nodes + __nodes_to_add;  // 计算现有节点加上要插入的节点的总数

  _Map_pointer __new_nstart;
  if (_M_map_size > 2 * __new_num_nodes) {  // 如果map的大小，比总数的两倍还要大，那么久不用申请了，挪一挪位置
    __new_nstart = _M_map + (_M_map_size - __new_num_nodes) / 2 
                     + (__add_at_front ? __nodes_to_add : 0);  // 新的start的位置的原则仍然是将元素放在居中位置，保证start和finish之后还有空间

   // 下面根据新的start和原有的start的位置来判断怎么拷贝map的nodes
    if (__new_nstart < _M_start._M_node) 
      copy(_M_start._M_node, _M_finish._M_node + 1, __new_nstart);
    else
      copy_backward(_M_start._M_node, _M_finish._M_node + 1, 
                    __new_nstart + __old_num_nodes);
  }
  else { // map的大小比两倍元素总数小了，要对map扩容， 扩容大小最小是原有map的大小的两倍，最大 = 原有map的大小 加上要插入的元素个数，再加上2
    size_type __new_map_size = 
      _M_map_size + max(_M_map_size, __nodes_to_add) + 2;

    _Map_pointer __new_map = _M_allocate_map(__new_map_size); // 申请新的map
    __new_nstart = __new_map + (__new_map_size - __new_num_nodes) / 2
                         + (__add_at_front ? __nodes_to_add : 0);  // 仍然是将start和finish的区间放到居中位置
    copy(_M_start._M_node, _M_finish._M_node + 1, __new_nstart); // 拷贝原有的map的节点到新map上
    _M_deallocate_map(_M_map, _M_map_size); // 将原有map的内存回收

  // 更新map和大小
    _M_map = __new_map;
    _M_map_size = __new_map_size;
  }

  // 更新map的start和finish
  _M_start._M_set_node(__new_nstart);
  _M_finish._M_set_node(__new_nstart + __old_num_nodes - 1);
}
```
有两种可能：
* 插入后元素总数小于map的大小的1/2： 此时就将原有的start和finish往中间挪一挪，以便插入时再申请内存片
* 插入后元素总数大于map的大小的1/2：对map扩容，重新申请map，再拷贝原有map 的数据到新map，详情见上面源码注释

### 弹出尾部 `pop_back`
```Cpp
  void pop_back() {
    if (_M_finish._M_cur != _M_finish._M_first) {
      --_M_finish._M_cur;
      destroy(_M_finish._M_cur);
    }
    else
      _M_pop_back_aux();
  }

// Called only if _M_finish._M_cur == _M_finish._M_first.
template <class _Tp, class _Alloc>
void deque<_Tp,_Alloc>::_M_pop_back_aux()
{
  _M_deallocate_node(_M_finish._M_first);
  _M_finish._M_set_node(_M_finish._M_node - 1);
  _M_finish._M_cur = _M_finish._M_last - 1;
  destroy(_M_finish._M_cur);
}
```
其实pop_back和pop_front一样，都可能出现一个情况，即弹出后，当前的内存片没有元素了，此时，就需要将没有元素的内存片释放，`_M_pop_back_aux`就是释放没有元素的内存片的。

 ## 插入元素
```Cpp
template <class _Tp, class _Alloc>
typename deque<_Tp, _Alloc>::iterator
deque<_Tp,_Alloc>::_M_insert_aux(iterator __pos, const value_type& __x)
{
  difference_type __index = __pos - _M_start;
  value_type __x_copy = __x;
  if (size_type(__index) < this->size() / 2) {
    push_front(front());  // 插入一个元素，用于申请内存和占位
    iterator __front1 = _M_start;
    ++__front1;
    iterator __front2 = __front1;
    ++__front2;
    __pos = _M_start + __index;
    iterator __pos1 = __pos;
    ++__pos1;
    copy(__front2, __pos1, __front1);  // 元素拷贝
  }
  else {
    push_back(back());  // 插入一个元素，用于申请内存和占位
    iterator __back1 = _M_finish;
    --__back1;
    iterator __back2 = __back1;
    --__back2;
    __pos = _M_start + __index;
    copy_backward(__pos, __back2, __back1); 拷贝
  }
  *__pos = __x_copy; // 要插入的元素
  return __pos;
}

  iterator insert(iterator position, const value_type& __x) {
    if (position._M_cur == _M_start._M_cur) { // 刚好是再前面插入，push_front完成
      push_front(__x); 
      return _M_start;
    }
    else if (position._M_cur == _M_finish._M_cur) {  // 刚好是在后面插入，push_back完成
      push_back(__x);
      iterator __tmp = _M_finish;
      --__tmp;
      return __tmp;
    }
    else {
      return _M_insert_aux(position, __x);  // 其他位置，要拷贝元素了
    }
  }
```
插入元素时，除了插在前端和尾端比较特殊外，其他情况都涉及到元素拷贝，因为deque是双向开口，因此拷贝时可以根据插入位置里start近还是离finish近，选择拷贝元素少的方向进行拷贝。
如果pos到start的距离比map的一半大小要小，就将start到pos的元素左移一个位置，具体做法是i先在front插入一个值，目的是申请空间，然后将start到pos的元素拷贝到以front的前一个位置；
否则就在后插入一个元素，将finish到pos的严肃用copy_backward的方式拷贝到fnishi后一个元素
最后再插入到pos。

[source issue](https://github.com/quinnwencn/blog/issues/92)
