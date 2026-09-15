---
title: "[STL] Source Code Analysis of vector"
date: 2025-01-02 00:00:00
tags:
  - "C/C++"
  - "STL"
  - "SGI"
categories:
  - "Systems C++"
---

# `vector`源码
`vector`的源码分析仍然是SGI的`vector`，我们来看`vector`的定义：
```Cpp
template <class _Tp, class _Alloc = __STL_DEFAULT_ALLOCATOR(_Tp) >
class vector : protected _Vector_base<_Tp, _Alloc> 
{
  // requirements:

  __STL_CLASS_REQUIRES(_Tp, _Assignable);

private:
  typedef _Vector_base<_Tp, _Alloc> _Base;
public:
  // vector 的嵌套类型定义
  typedef _Tp value_type;
  typedef value_type* pointer;
  typedef const value_type* const_pointer;
  typedef value_type* iterator;   // vector的迭代器是普通指针
  typedef const value_type* const_iterator;
  typedef value_type& reference;
  typedef const value_type& const_reference;
  typedef size_t size_type;
  typedef ptrdiff_t difference_type;

  typedef typename _Base::allocator_type allocator_type;
  allocator_type get_allocator() const { return _Base::get_allocator(); }

#ifdef __STL_CLASS_PARTIAL_SPECIALIZATION
  typedef reverse_iterator<const_iterator> const_reverse_iterator;
  typedef reverse_iterator<iterator> reverse_iterator;
#else /* __STL_CLASS_PARTIAL_SPECIALIZATION */
  typedef reverse_iterator<const_iterator, value_type, const_reference, 
                           difference_type>  const_reverse_iterator;
  typedef reverse_iterator<iterator, value_type, reference, difference_type>
          reverse_iterator;
#endif /* __STL_CLASS_PARTIAL_SPECIALIZATION */

protected:
#ifdef __STL_HAS_NAMESPACES
  using _Base::_M_allocate;
  using _Base::_M_deallocate;
  using _Base::_M_start;   // 表示目前使用的空间头
  using _Base::_M_finish;  // 表示目前使用的空间尾
  using _Base::_M_end_of_storage;   // 表示目前可用的空间的尾
#endif /* __STL_HAS_NAMESPACES */

protected:
  void _M_insert_aux(iterator __position, const _Tp& __x);  // 非常重要的成员函数
  void _M_insert_aux(iterator __position);  // 这个也是，只不过是调用默认构造函数

public:
  iterator begin() { return _M_start; }  // begin使用的就是_Vector_base的_M_start
  const_iterator begin() const { return _M_start; }
  iterator end() { return _M_finish; } // end使用的就是_Vector_base的_M_finish
  const_iterator end() const { return _M_finish; }

  reverse_iterator rbegin()
    { return reverse_iterator(end()); }
  const_reverse_iterator rbegin() const
    { return const_reverse_iterator(end()); }
  reverse_iterator rend()
    { return reverse_iterator(begin()); }
  const_reverse_iterator rend() const
    { return const_reverse_iterator(begin()); }

  size_type size() const
    { return size_type(end() - begin()); }
  size_type max_size() const
    { return size_type(-1) / sizeof(_Tp); }
  size_type capacity() const
    { return size_type(_M_end_of_storage - begin()); }  // 使用申请时的尾部内存地址减去其实地址
  bool empty() const
    { return begin() == end(); }

  reference operator[](size_type __n) { return *(begin() + __n); }
  const_reference operator[](size_type __n) const { return *(begin() + __n); }

#ifdef __STL_THROW_RANGE_ERRORS
  void _M_range_check(size_type __n) const {
    if (__n >= this->size())
      __stl_throw_range_error("vector");
  }

  reference at(size_type __n)  // at会检查是否越界
    { _M_range_check(__n); return (*this)[__n]; }
  const_reference at(size_type __n) const
    { _M_range_check(__n); return (*this)[__n]; }
#endif /* __STL_THROW_RANGE_ERRORS */

  explicit vector(const allocator_type& __a = allocator_type())
    : _Base(__a) {}

  vector(size_type __n, const _Tp& __value,
         const allocator_type& __a = allocator_type()) 
    : _Base(__n, __a)
    { _M_finish = uninitialized_fill_n(_M_start, __n, __value); }

  explicit vector(size_type __n)
    : _Base(__n, allocator_type())
    { _M_finish = uninitialized_fill_n(_M_start, __n, _Tp()); }

  vector(const vector<_Tp, _Alloc>& __x) 
    : _Base(__x.size(), __x.get_allocator())
    { _M_finish = uninitialized_copy(__x.begin(), __x.end(), _M_start); }

#ifdef __STL_MEMBER_TEMPLATES
  // Check whether it's an integral type.  If so, it's not an iterator.
  template <class _InputIterator>
  vector(_InputIterator __first, _InputIterator __last,
         const allocator_type& __a = allocator_type()) : _Base(__a) {
    typedef typename _Is_integer<_InputIterator>::_Integral _Integral;
    _M_initialize_aux(__first, __last, _Integral());
  }

  template <class _Integer>
  void _M_initialize_aux(_Integer __n, _Integer __value, __true_type) {
    _M_start = _M_allocate(__n);
    _M_end_of_storage = _M_start + __n; 
    _M_finish = uninitialized_fill_n(_M_start, __n, __value);
  }

  template <class _InputIterator>
  void _M_initialize_aux(_InputIterator __first, _InputIterator __last,
                         __false_type) {
    _M_range_initialize(__first, __last, __ITERATOR_CATEGORY(__first));
  }

#else
  vector(const _Tp* __first, const _Tp* __last,
         const allocator_type& __a = allocator_type())
    : _Base(__last - __first, __a) 
    { _M_finish = uninitialized_copy(__first, __last, _M_start); }
#endif /* __STL_MEMBER_TEMPLATES */

  ~vector() { destroy(_M_start, _M_finish); }   // 全局函数，之前的Alloc分析里有讲到过，根据是否trivial进行不同的析构， 释放内存由_Vector_base的析构函数完成

  vector<_Tp, _Alloc>& operator=(const vector<_Tp, _Alloc>& __x);
  void reserve(size_type __n) {
    if (capacity() < __n) {
      const size_type __old_size = size();
      iterator __tmp = _M_allocate_and_copy(__n, _M_start, _M_finish);
      destroy(_M_start, _M_finish);
      _M_deallocate(_M_start, _M_end_of_storage - _M_start);
      _M_start = __tmp;
      _M_finish = __tmp + __old_size;
      _M_end_of_storage = _M_start + __n;
    }
  }

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

  template <class _InputIter>
  void _M_assign_dispatch(_InputIter __first, _InputIter __last, __false_type)
    { _M_assign_aux(__first, __last, __ITERATOR_CATEGORY(__first)); }

  template <class _InputIterator>
  void _M_assign_aux(_InputIterator __first, _InputIterator __last,
                     input_iterator_tag);

  template <class _ForwardIterator>
  void _M_assign_aux(_ForwardIterator __first, _ForwardIterator __last,
                     forward_iterator_tag); 

#endif /* __STL_MEMBER_TEMPLATES */

  reference front() { return *begin(); }  // 第一个元素
  const_reference front() const { return *begin(); }
  reference back() { return *(end() - 1); } // 最后一个元素
  const_reference back() const { return *(end() - 1); }

  void push_back(const _Tp& __x) {
    if (_M_finish != _M_end_of_storage) {  // 首先判断是否空间已满
      construct(_M_finish, __x);  // 空间不满，直接在_M_finish的地方构造一个，这里会执行拷贝构造，然后递增_M_finish
      ++_M_finish;
    }
    else  // 满了，得执行插入操作，会涉及拷贝内存
      _M_insert_aux(end(), __x);
  }
  void push_back() {  // 之前一直不知道还有输入为空的push_back
    if (_M_finish != _M_end_of_storage) {
      construct(_M_finish);  // 还有空间，就在末尾构造一个
      ++_M_finish;
    }
    else
      _M_insert_aux(end());
  }
  void swap(vector<_Tp, _Alloc>& __x) {
    __STD::swap(_M_start, __x._M_start);
    __STD::swap(_M_finish, __x._M_finish);
    __STD::swap(_M_end_of_storage, __x._M_end_of_storage);
  }

  iterator insert(iterator __position, const _Tp& __x) {
    size_type __n = __position - begin();
    if (_M_finish != _M_end_of_storage && __position == end()) {
      construct(_M_finish, __x);
      ++_M_finish;
    }
    else
      _M_insert_aux(__position, __x);
    return begin() + __n;
  }
  iterator insert(iterator __position) {
    size_type __n = __position - begin();
    if (_M_finish != _M_end_of_storage && __position == end()) {
      construct(_M_finish);
      ++_M_finish;
    }
    else
      _M_insert_aux(__position);
    return begin() + __n;
  }
#ifdef __STL_MEMBER_TEMPLATES
  // Check whether it's an integral type.  If so, it's not an iterator.
  template <class _InputIterator>
  void insert(iterator __pos, _InputIterator __first, _InputIterator __last) {
    typedef typename _Is_integer<_InputIterator>::_Integral _Integral;
    _M_insert_dispatch(__pos, __first, __last, _Integral());
  }

  template <class _Integer>
  void _M_insert_dispatch(iterator __pos, _Integer __n, _Integer __val,
                          __true_type)
    { _M_fill_insert(__pos, (size_type) __n, (_Tp) __val); }

  template <class _InputIterator>
  void _M_insert_dispatch(iterator __pos,
                          _InputIterator __first, _InputIterator __last,
                          __false_type) {
    _M_range_insert(__pos, __first, __last, __ITERATOR_CATEGORY(__first));
  }
#else /* __STL_MEMBER_TEMPLATES */
  void insert(iterator __position,
              const_iterator __first, const_iterator __last);
#endif /* __STL_MEMBER_TEMPLATES */

  void insert (iterator __pos, size_type __n, const _Tp& __x)
    { _M_fill_insert(__pos, __n, __x); }

  void _M_fill_insert (iterator __pos, size_type __n, const _Tp& __x);

  void pop_back() {  // 将尾端元素取出，并缩小_M_finish
    --_M_finish;
    destroy(_M_finish);  // 由于尾部是最后一个元素的下一个，因此此处实际上就是析构弹出的元素的地址
  }
  iterator erase(iterator __position) {   
    if (__position + 1 != end())  // 如果擦除的不是最后一个元素，那么需要将后面的元素拷贝到当前迭代器的位置
      copy(__position + 1, _M_finish, __position);
    --_M_finish; // 这里的操作对于擦除最后一个以及不是最后一个都是一样的处理
    destroy(_M_finish); // 把原来的最后一个元素析构
    return __position;  // 从内存的角度上来看，还是原来的地址，但是改地址存储的元素已经变成下一个了
  }
  iterator erase(iterator __first, iterator __last) {  // 擦除一块
    iterator __i = copy(__last, _M_finish, __first); // 直接把last以及以后的都往前copy
    destroy(__i, _M_finish); // 然后再把已经失效的内存析构掉
    _M_finish = _M_finish - (__last - __first); // 更新大小
    return __first; // 地址没变，但是指向的元素变了
  }

  void resize(size_type __new_size, const _Tp& __x) {  // 带值的resize
    if (__new_size < size()) 
      erase(begin() + __new_size, end());  // 如果要求的空间小于当前的空间大小，直接将尾部到新空间尾部的空间擦除备用
    else
      insert(end(), __new_size - size(), __x);  // 新空间比目前的空间大，由insert流程进行扩容
  }
  void resize(size_type __new_size) { resize(__new_size, _Tp()); }  // 不带值的resize会调用默认构造函数，因此如果某个类型不支持默认构造函数，那应该无法调用这个
  void clear() { erase(begin(), end()); }  // clear会析构所有元素，并将start和finish重新设置为0

protected:

#ifdef __STL_MEMBER_TEMPLATES
  template <class _ForwardIterator>
  iterator _M_allocate_and_copy(size_type __n, _ForwardIterator __first, 
                                               _ForwardIterator __last)
{
    iterator __result = _M_allocate(__n);
    __STL_TRY {
      uninitialized_copy(__first, __last, __result);
      return __result;
    }
    __STL_UNWIND(_M_deallocate(__result, __n));
  }
#else /* __STL_MEMBER_TEMPLATES */
  iterator _M_allocate_and_copy(size_type __n, const_iterator __first, 
                                               const_iterator __last)
  {
    iterator __result = _M_allocate(__n);
    __STL_TRY {
      uninitialized_copy(__first, __last, __result);
      return __result;
    }
    __STL_UNWIND(_M_deallocate(__result, __n));
  }
#endif /* __STL_MEMBER_TEMPLATES */


#ifdef __STL_MEMBER_TEMPLATES
  template <class _InputIterator>
  void _M_range_initialize(_InputIterator __first,  
                           _InputIterator __last, input_iterator_tag)
  {
    for ( ; __first != __last; ++__first)
      push_back(*__first);
  }

  // This function is only called by the constructor. 
  template <class _ForwardIterator>
  void _M_range_initialize(_ForwardIterator __first,
                           _ForwardIterator __last, forward_iterator_tag)
  {
    size_type __n = 0;
    distance(__first, __last, __n);
    _M_start = _M_allocate(__n);
    _M_end_of_storage = _M_start + __n;
    _M_finish = uninitialized_copy(__first, __last, _M_start);
  }

  template <class _InputIterator>
  void _M_range_insert(iterator __pos,
                       _InputIterator __first, _InputIterator __last,
                       input_iterator_tag);

  template <class _ForwardIterator>
  void _M_range_insert(iterator __pos,
                       _ForwardIterator __first, _ForwardIterator __last,
                       forward_iterator_tag);

#endif /* __STL_MEMBER_TEMPLATES */
};
```
首先看内存分配器：`class _Alloc = __STL_DEFAULT_ALLOCATOR(_Tp)`，SGI的STL代码中，没有使用STL默认的内存分配器，因此，这里定义选用的是alloc，也就是前面介绍的[SGI自定义的分级内存分配](https://github.com/quinnwencn/blog/issues/87):
```Cpp
# ifndef __STL_DEFAULT_ALLOCATOR
#   ifdef __STL_USE_STD_ALLOCATORS
#     define __STL_DEFAULT_ALLOCATOR(T) allocator< T >
#   else
#     define __STL_DEFAULT_ALLOCATOR(T) alloc
#   endif
# endif
```
`vector` protected继承自 `_Vector_base`, `_Vector_base`的功能简单，只是做了内存申请和释放，以及获取内存分配器的工作而已：
```Cpp
template <class _Tp, class _Alloc> 
class _Vector_base {
public:
  typedef _Alloc allocator_type;  // vector使用的是alloc，因此_Alloc也是alloc
  allocator_type get_allocator() const { return allocator_type(); }

  _Vector_base(const _Alloc&)
    : _M_start(0), _M_finish(0), _M_end_of_storage(0) {}
  _Vector_base(size_t __n, const _Alloc&)
    : _M_start(0), _M_finish(0), _M_end_of_storage(0) 
  {
    _M_start = _M_allocate(__n);
    _M_finish = _M_start;
    _M_end_of_storage = _M_start + __n;
  }

  ~_Vector_base() { _M_deallocate(_M_start, _M_end_of_storage - _M_start); }

protected:
  _Tp* _M_start;  // 申请内存你的起始地址
  _Tp* _M_finish;  // 使用了的内存的结束地址，初始化时，和_M_start一致，因为没有使用
  _Tp* _M_end_of_storage;  // 申请的内存的末尾地址，相当于capacity

  typedef simple_alloc<_Tp, _Alloc> _M_data_allocator;   // 为了方便以元素的size为大小申请内存
  _Tp* _M_allocate(size_t __n)
    { return _M_data_allocator::allocate(__n); }
  void _M_deallocate(_Tp* __p, size_t __n) 
    { _M_data_allocator::deallocate(__p, __n); }
};
```
其中，`_M_start`，`_M_finish`和`_M_end_of_storage`分别是申请的内存的起始地址、使用了的内存的末地址，以及内存大小尾地址。由于`vector`是通过protected集成，因此这些成员`vector`也可以访问到。
`vector`的操作对内部内存你的影响可以参考这个图：
![image](https://github.com/user-attachments/assets/fc595d70-7f3c-4557-8bdf-be7c6b389c07)

## constructor
`vector`的构造函数分为几个：
* 是默认构造函数：`explicit vector(const allocator_type& __a = allocator_type())`，默认指定alloc作为内存分配器，由于没有指定分配的大小，因此该构造函数实际上没有分配内存
* 指定分配大小：`explicit vector(size_type __n)`，改构造函数使用默认的内存分配器分配n个大小的内存，并调用元素类型的默认构造函数对内存进行构造
* 指定大小和初始值：`vector(size_type __n, const _Tp& __value, const allocator_type& __a = allocator_type()) `, 使用默认的alloc作为内存分配器，并构造n个类型大小的内存，拷贝构造该区域
* 拷贝构造函数：`vector(const vector<_Tp, _Alloc>& __x) `，内部调用`uninitialized_copy`进行拷贝构造吗，内部会对是不是trivial区别对待。

展开来看：
```Cpp
  vector(size_type __n, const _Tp& __value,
         const allocator_type& __a = allocator_type()) 
    : _Base(__n, __a)
    { _M_finish = uninitialized_fill_n(_M_start, __n, __value); }
```
vector如果指定元素个数，都是调用了`uninitialized_fill_n`对内存进行构造，然后该函数内部调用的是：
```Cpp
// Valid if copy construction is equivalent to assignment, and if the
//  destructor is trivial.
template <class _ForwardIter, class _Size, class _Tp>
inline _ForwardIter
__uninitialized_fill_n_aux(_ForwardIter __first, _Size __n,
                           const _Tp& __x, __true_type)
{
  return fill_n(__first, __n, __x);
}

template <class _ForwardIter, class _Size, class _Tp>
_ForwardIter
__uninitialized_fill_n_aux(_ForwardIter __first, _Size __n,
                           const _Tp& __x, __false_type)
{
  _ForwardIter __cur = __first;
  __STL_TRY {
    for ( ; __n > 0; --__n, ++__cur)
      _Construct(&*__cur, __x);
    return __cur;
  }
  __STL_UNWIND(_Destroy(__first, __cur));
}

template <class _ForwardIter, class _Size, class _Tp, class _Tp1>
inline _ForwardIter 
__uninitialized_fill_n(_ForwardIter __first, _Size __n, const _Tp& __x, _Tp1*)
{
  typedef typename __type_traits<_Tp1>::is_POD_type _Is_POD;
  return __uninitialized_fill_n_aux(__first, __n, __x, _Is_POD());
}

template <class _ForwardIter, class _Size, class _Tp>
inline _ForwardIter 
uninitialized_fill_n(_ForwardIter __first, _Size __n, const _Tp& __x)
{
  return __uninitialized_fill_n(__first, __n, __x, __VALUE_TYPE(__first));
}
```
从上述的代码可以看出，`uninitialized_fill_n`内部调用了`__uninitialized_fill_n`，`__uninitialized_fill_n`内部会根据Tp1的类型，推断POD数据类型，POD类型的构造会更简单，直接赋值(`fill_n`)；否则就需要调用placement new构造。

## 尾部插入数据 `push_back`
```Cpp
void push_back(const _Tp& __x) {
    if (_M_finish != _M_end_of_storage) {
      construct(_M_finish, __x);
      ++_M_finish;
    }
    else
      _M_insert_aux(end(), __x);
  }
```
尾部插入数据时，根据当前容器的大小，有不同的操作：
* 当前的大小小于容器的容量： 直接在尾部构造一个对象，并扩大大小
* 当前的大小已经是容器的容器：没有空间容纳新增的对象了，需要重新申请内存（2倍大小），并将原有数据拷贝到新内存，然后在尾部构造插入的元素，这一部分的实现是`_M_insert_aux(end(), __x)```

```Cpp
template <class _Tp, class _Alloc>
void 
vector<_Tp, _Alloc>::_M_insert_aux(iterator __position, const _Tp& __x)
{
  if (_M_finish != _M_end_of_storage) {
    construct(_M_finish, *(_M_finish - 1));
    ++_M_finish;
    _Tp __x_copy = __x;
    copy_backward(__position, _M_finish - 2, _M_finish - 1);
    *__position = __x_copy;
  }
  else {
    const size_type __old_size = size();
    const size_type __len = __old_size != 0 ? 2 * __old_size : 1;  // 计算新空间
    iterator __new_start = _M_allocate(__len);
    iterator __new_finish = __new_start;
    __STL_TRY {
      __new_finish = uninitialized_copy(_M_start, __position, __new_start);
      construct(__new_finish, __x);
      ++__new_finish;
      __new_finish = uninitialized_copy(__position, _M_finish, __new_finish);
    }
    __STL_UNWIND((destroy(__new_start,__new_finish), 
                  _M_deallocate(__new_start,__len)));
    destroy(begin(), end());
    _M_deallocate(_M_start, _M_end_of_storage - _M_start);
    _M_start = __new_start;
    _M_finish = __new_finish;
    _M_end_of_storage = __new_start + __len;
  }
}
```
在插入尾部时，走的是else分支。可以看到，有以下步骤：
1. 此时会先获取新的容器大小，如果原来的容器是空的，就是1，否则就是原有空间的两倍
2. 申请新内存，新内存位于`__new_start`和`_new_finish
3. 通过`uninitialized_copy`将原容器的数据，拷贝到新申请的内存中，然后在新的尾部构造插入的元素(`construct(__new_finish, __x);`)，更新`__new_finish`.
4. 析构原容器的内存
5. 返回原有的容器的内存到STL的内存分配器中（根据大小插入链表）
6. 更新容器的`_M_start`， `_M_finish`和`_M_end_of_storage`。

## 随机插入 `insert`
插入有多个版本，插入一个和插入一片：
### 插入一个值
```Cpp
iterator insert(iterator __position, const _Tp& __x) {
    size_type __n = __position - begin();
    if (_M_finish != _M_end_of_storage && __position == end()) {
      construct(_M_finish, __x);
      ++_M_finish;
    }
    else
      _M_insert_aux(__position, __x);
    return begin() + __n;
  }
```
插入时，有两种可能：
* 插入尾部：容器没满并且插入的位置是容器尾部，此时在尾部直接构造，并递增尾部`_M_finish`；
* 同样是调用`_M_insert_aux`，和push_back一样。如果插入的位置是尾部，那么做法和push_back扩容一样；如果不是尾部，那么走的就是if分支
```Cpp
  if (_M_finish != _M_end_of_storage) {
    construct(_M_finish, *(_M_finish - 1));
    ++_M_finish;
    _Tp __x_copy = __x;
    copy_backward(__position, _M_finish - 2, _M_finish - 1);
    *__position = __x_copy;
  }
```
if分支里，容器的大小小于容器的容量，因此在容器尾部构造一个元素，构造的值是尾部原来的元素，然后搬运插入位置之后的值，再在插入的位置构造插入的元素。

### 插入一片区域
```Cpp
template <class _Tp, class _Alloc>
void 
vector<_Tp, _Alloc>::insert(iterator __position, 
                            const_iterator __first, 
                            const_iterator __last)
{
  if (__first != __last) {
    size_type __n = 0;
    distance(__first, __last, __n);  // 计算插入的size
    if (size_type(_M_end_of_storage - _M_finish) >= __n) {  // 现有容量大于要插入的个数
      const size_type __elems_after = _M_finish - __position;
      iterator __old_finish = _M_finish;
      if (__elems_after > __n) {
        uninitialized_copy(_M_finish - __n, _M_finish, _M_finish);  // 将尾部n个元素，先都搬到尾部以后的空间
        _M_finish += __n;
        copy_backward(__position, __old_finish - __n, __old_finish); // 将 position 开始的n个元素，拷贝到以old_finish结尾的位置， 腾出位置给要插入的元素
        copy(__first, __last, __position);  // 然后再把要插入的元素拷贝到position开始的位置
      }
      else {
        uninitialized_copy(__first + __elems_after, __last, _M_finish);  // 先将把要插入的元素中的后 elems_after个的元素拷贝到尾部
        _M_finish += __n - __elems_after; // 更新尾部
        uninitialized_copy(__position, __old_finish, _M_finish); // 然后将插入位置到初始尾部的元素拷贝到新尾部
        _M_finish += __elems_after; // 再更新尾部
        copy(__first, __first + __elems_after, __position);  // 将要插入的元素的前elems_after个元素插入到position的地方
      }
    }
    else {  // 容器的剩余容量小于要插入的数量
      const size_type __old_size = size();
      const size_type __len = __old_size + max(__old_size, __n);  // 计算 新的大小，取容器的size加上size与插入元素个数的最大值作为新内存大小
      iterator __new_start = _M_allocate(__len);  // 重新申请内存
      iterator __new_finish = __new_start;
      __STL_TRY {
        __new_finish = uninitialized_copy(_M_start, __position, __new_start); // 将开始到pisition的元素拷贝过去
        __new_finish = uninitialized_copy(__first, __last, __new_finish); 再拷贝要插入的元素
        __new_finish
          = uninitialized_copy(__position, _M_finish, __new_finish); // 然后再拷贝剩余的元素
      }
      __STL_UNWIND((destroy(__new_start,__new_finish),
                    _M_deallocate(__new_start,__len)));  //  有出错，就将新内存析构并释放，可以看到，原始容器没修改
      destroy(_M_start, _M_finish);   // 拷贝成功就析构原始容器的内存元素
      _M_deallocate(_M_start, _M_end_of_storage - _M_start); // 并返回内存到内存池
      _M_start = __new_start;
      _M_finish = __new_finish;
      _M_end_of_storage = __new_start + __len; //  更新容器大小和起始地址
    }
  }
}
```
插入一片区域时，默认插入的区域的迭代器不相等，否则就相当于没插入了。插入时，首先计算要插入的元素个数n：
* 如果容器的还有容量能够容得下插入的元素
   * 如果插入位置之后的元素个数大于要插入的元素个数：
       * 那么将尾部n个元素，先都搬到尾部以后的空间，然后将position开始的n个元素，使用`copy_backend` 拷贝到以__old_finish结尾的内存空间，为插入的元素腾出空间
       * 拷贝要插入的元素到position开始的内存
    * 插入位置之后的元素个数小于要插入的元素个数：
       * 我们假设要插入位置position后还有N个元素，那么我们将要插入的数据N个之后的数据插入到容器尾部， 更新容器尾部
       * 然后将原始容器position到旧尾部的元素，拷贝到新尾部开始的内存
       * 最后将要插入元素的前N个拷贝到position开始的位置
* 如果要插入的元素个数大于容器剩余容量
    * 计算新空间大小new_size，新空间大小new_size等于原容器的大小old_size，加上 要插入元素空间n的最大值，即 $new_size = old_size + max(old_size, n)$
    * 重新分配new_size的内存
    * 将原容器的开始到position的元素拷贝到新内存起始地址_new_start
    * 将要插入的元素拷贝到新内存的位置，该位置由上一步拷贝返回
    * 将原容器的剩余元素拷贝到上一步返回的地址
    * 如果上述三步任何一步出错，就将新申请的内粗析构再插回内存链表
    * 成功则析构并将原始容器的内存放回链表，更新新容器的start, finish和end_of_storage

## `pop_back`
```Cpp
void pop_back() {
    --_M_finish;
    destroy(_M_finish);
  }
```
`pop_back`的代码相对简单，那就是将`_M_finish`递减，并析构，但是为什么不判断是否为空呢？可能是为了避免冗余检查，并把调用`pop_back`时确保容器不为空的责任留给了开发者。

## `erase`
  iterator erase(iterator __position) {
    if (__position + 1 != end())
      copy(__position + 1, _M_finish, __position);
    --_M_finish;
    destroy(_M_finish);
    return __position;  // 实际上迭代器没有变，只是迭代器指向的数据变了，也可以说是失效了。
  }
  iterator erase(iterator __first, iterator __last) {
    iterator __i = copy(__last, _M_finish, __first);
    destroy(__i, _M_finish);
    _M_finish = _M_finish - (__last - __first);
    return __first;
  }
```
`erase`有两个版本：
* erase单一迭代器： 如果删除的位置不是尾部，那么就将后一个元素到尾部的元素向前拷贝一个位置，否则就直接删除尾部
* erase一片区域：直接将last开始，到尾部的元素，拷贝到first开始的位置，并把返回迭代器到尾部迭代器的内存析构，然后更新尾部迭代器；

## `clear`
```Cpp
void clear() { erase(begin(), end()); }
```
调用erase把开始到尾部迭代器的都擦除

[source issue](https://github.com/quinnwencn/blog/issues/90)
