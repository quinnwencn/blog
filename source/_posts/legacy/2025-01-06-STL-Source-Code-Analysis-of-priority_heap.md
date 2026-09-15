---
title: "[STL] Source Code Analysis of priority_heap"
date: 2025-01-06 00:00:00
tags:
  - "C/C++"
  - "STL"
  - "SGI"
categories:
  - "Systems C++"
---

# 背景
在介绍`priority_heap`之前，首先需要了解`heap`，`heap`虽然不属于STL的容器，但是却是`priority queue`必不可缺的一个基础功能。`priority queue`可以让用户以任何顺序把元素插入容器中，但是在取出时可以从优先级最高的元素开始取，这就是binary max heap的特点，因此`priority queue`就是以heap作为底层实现。

查找最大值或者最小值，是比较常见的算法，如果使用vector、deque或者list查找，需要遍历一遍容器，时间复杂度是O(N)，如果需要经常插入元素，那么还需要考虑容器复制带来的额外损耗，虽然list可以实现O(1)插入和删除，但是查找仍然需要O(N)的复杂度。虽然维护一个max或者min变量，可以在建立容器时始终得知最大值和最小值，但是如果要计算取出最大值后的最大值，也就是次大值，就必须再遍历一遍。

二叉搜索树倒是个不错的解决方案，可以实现插入和查找都时O(log N)复杂度，但是实现困难，binary heap就是介于这两者之间的方案。binary heap实际上是一中完全二叉树，即除了最底层的叶子节点外，都是满二叉树。最底层的叶子节点从左到右不允许有空隙，如下图所示：
![image](https://github.com/user-attachments/assets/7cb33e3c-1cb2-4c80-b9ea-75b185943764)


binary heap分为max-heap和min-heap两种，max-heap的节点都大于或者等于子节点，min-heap的节点都小于或者等于子节点，这样我们就很容易获取一个容器的最大值和最小值。在堆的实现时，我们经常把0元素设置为一个无限大或者是无限小的值，这样就保证了一个节点i的左节点肯定位于2i处，而右节点肯定位于2i+ 1。由于我们需要对容器进行push操作，实际上使用vector比较符合heap的用法。

## max-heap 实现过程
### 插入
我画了一张图表示插入过程，可以看到，我们每次插入时，都和父节点对比，如果引入了比父节点大的节点，就递归向上，直到父节点比子节点大。图中，黄色的节点表示出现了破坏heap结构的节点，绿色就表示为了恢复heap'结构而做出的交换行为。
![stl_heap drawio](https://github.com/user-attachments/assets/d6cb367a-26bb-4e72-93e4-21dcfcb17759)

### 删除
heap的删除操作只会取出极值，即取出树的顶点，取出后将最后一个节点的值放回顶点，然后再和两个子节点的最大值交换，直到交换到叶子节点（交换到父节点都大于子节点）：
![stl_heap_pop drawio](https://github.com/user-attachments/assets/a56ebd0f-4c44-43c3-88e5-8b1312755104)

# `heap`源码
## `push_heap`
虽然把0节点当做一个fake节点容易理解heap的结构，但是为了节省空间，STL中的做法仍然采用0节点作为树的顶点，因此左节点就是$2i + 1$， 右节点就是$2(i + 1)$，如果知道了左节点或者右节点，快速求取父节点的方法就是$(i - 1) / 2$。
```Cpp
template <class _RandomAccessIterator, class _Distance, class _Tp>
void 
__push_heap(_RandomAccessIterator __first,
            _Distance __holeIndex, _Distance __topIndex, _Tp __value)
{
  _Distance __parent = (__holeIndex - 1) / 2;
  while (__holeIndex > __topIndex && *(__first + __parent) < __value) {
    *(__first + __holeIndex) = *(__first + __parent);
    __holeIndex = __parent;
    __parent = (__holeIndex - 1) / 2;
  }    
  *(__first + __holeIndex) = __value;
}

template <class _RandomAccessIterator, class _Distance, class _Tp>
inline void 
__push_heap_aux(_RandomAccessIterator __first,
                _RandomAccessIterator __last, _Distance*, _Tp*)
{
  __push_heap(__first, _Distance((__last - __first) - 1), _Distance(0), 
              _Tp(*(__last - 1)));
}

template <class _RandomAccessIterator>
inline void 
push_heap(_RandomAccessIterator __first, _RandomAccessIterator __last)
{
  __STL_REQUIRES(_RandomAccessIterator, _Mutable_RandomAccessIterator);
  __STL_REQUIRES(typename iterator_traits<_RandomAccessIterator>::value_type,
                 _LessThanComparable);
  __push_heap_aux(__first, __last,
                  __DISTANCE_TYPE(__first), __VALUE_TYPE(__first));
}
```
提供cmp的版本：
```Cpp
template <class _RandomAccessIterator, class _Compare>
inline void 
push_heap(_RandomAccessIterator __first, _RandomAccessIterator __last,
          _Compare __comp)
{
  __STL_REQUIRES(_RandomAccessIterator, _Mutable_RandomAccessIterator);
  __push_heap_aux(__first, __last, __comp,
                  __DISTANCE_TYPE(__first), __VALUE_TYPE(__first));
}
```
`push_heap`提供了基于头尾迭代器的方法，有了头尾迭代器，可以很方便计算最后插入的元素、元素的下标、元素的类型等。cmp提供了可定制的堆类型，可以基于cmp实现max-heap和min-heap。
`push_heap`内部调用的是`__push_heap_aux`，`__push_heap_aux`内部通过 _Distance((__last - __first) - 1)计算出新插入元素的下标（因为last指向最后一个元素后一个位置），通过 _Tp(*(__last - 1))获取最后插入的元素值。
`__push_heap`内部实现的就是堆的平衡过程：
* 计算插入元素的父节点： _Distance __parent = (__holeIndex - 1) / 2;，由于根节点在0，所以求父节点和上述方法一致
* 当子节点比父节点大时，交换父节点和子节点
* 最后把插入的节点插入适合位置

## `pop_heap`
```Cpp
template <class _RandomAccessIterator, class _Distance, class _Tp>
void 
__adjust_heap(_RandomAccessIterator __first, _Distance __holeIndex,
              _Distance __len, _Tp __value)
{
  _Distance __topIndex = __holeIndex;
  _Distance __secondChild = 2 * __holeIndex + 2; // 右子节点计算方式 2(i + 1)
  while (__secondChild < __len) {
    if (*(__first + __secondChild) < *(__first + (__secondChild - 1)))  // 找到左右节点最大的一个
      __secondChild--;
    *(__first + __holeIndex) = *(__first + __secondChild);  // 赋值给父节点
    __holeIndex = __secondChild;  // 更新被选取的最大值的子节点为父节点，
    __secondChild = 2 * (__secondChild + 1); // 更新右子节点
  }
  if (__secondChild == __len) {  // 没有右子节点， 只有左子节点
    *(__first + __holeIndex) = *(__first + (__secondChild - 1)); // 父节点更新为左子节点的值
    __holeIndex = __secondChild - 1; //更新空洞值为左子节点，也就是刚才取出的元素插入的地方。
  }
  __push_heap(__first, __holeIndex, __topIndex, __value);
}

template <class _RandomAccessIterator, class _Tp, class _Distance>
inline void 
__pop_heap(_RandomAccessIterator __first, _RandomAccessIterator __last,
           _RandomAccessIterator __result, _Tp __value, _Distance*)
{
  *__result = *__first; // 将根节点放到尾部，实现pop，所以pop只是把根节点放到了尾部
  __adjust_heap(__first, _Distance(0), _Distance(__last - __first), __value);
}

template <class _RandomAccessIterator, class _Tp>
inline void 
__pop_heap_aux(_RandomAccessIterator __first, _RandomAccessIterator __last,
               _Tp*)
{
  __pop_heap(__first, __last - 1, __last - 1, 
             _Tp(*(__last - 1)), __DISTANCE_TYPE(__first));  // 获取原尾部元素的值
}

template <class _RandomAccessIterator>
inline void pop_heap(_RandomAccessIterator __first, 
                     _RandomAccessIterator __last)
{
  __STL_REQUIRES(_RandomAccessIterator, _Mutable_RandomAccessIterator);
  __STL_REQUIRES(typename iterator_traits<_RandomAccessIterator>::value_type,
                 _LessThanComparable);
  __pop_heap_aux(__first, __last, __VALUE_TYPE(__first));
}
```
STL的`pop_heap`操作实际上是将尾部元素取出来，然后将根节点元素放到尾部，这样最大值（max-heap）就pop出来了。`pop_heap`的输入参数只有first和last两个迭代器，然后通过调用`__pop_heap_aux`，获得尾部元素的值：_Tp(*(__last - 1))， 并调用`__pop_heap`，将根节点的值复制给尾部元素，这样，原尾部元素的值和根节点都得到妥善处理，然后再调整堆：`__adjust_heap`，调整堆使用的就是前面描述的方法，从根节点左右节点开始，选择最大的放到父节点，最后再使用push方法把取出的元素放回去。

## `sort_heap`
由于每次`pop_heap`都能将数组中最大的元素放到尾部，如果反复调用`pop_heap`实际上就是一个递增排序的过程：
```Cpp
template <class _RandomAccessIterator, class _Compare>
void 
sort_heap(_RandomAccessIterator __first,
          _RandomAccessIterator __last, _Compare __comp)
{
  __STL_REQUIRES(_RandomAccessIterator, _Mutable_RandomAccessIterator);
  while (__last - __first > 1)
    pop_heap(__first, __last--, __comp);
}
```

## `make_heap`
```Cpp
template <class _RandomAccessIterator, class _Tp, class _Distance>
void 
__make_heap(_RandomAccessIterator __first,
            _RandomAccessIterator __last, _Tp*, _Distance*)
{
  if (__last - __first < 2) return; // 只有一个元素或者没有元素就不用排了
  _Distance __len = __last - __first;  
  _Distance __parent = (__len - 2)/2; // 找第一个需要重排的子树头部，标记为parent，然后基于adjust_heap重排整理子树
    
  while (true) {
    __adjust_heap(__first, __parent, __len, _Tp(*(__first + __parent)));
    if (__parent == 0) return;
    __parent--;  // 排完后，向前选择另一个头部
  }
}

template <class _RandomAccessIterator>
inline void 
make_heap(_RandomAccessIterator __first, _RandomAccessIterator __last)
{
  __STL_REQUIRES(_RandomAccessIterator, _Mutable_RandomAccessIterator);
  __STL_REQUIRES(typename iterator_traits<_RandomAccessIterator>::value_type,
                 _LessThanComparable);
  __make_heap(__first, __last,
              __VALUE_TYPE(__first), __DISTANCE_TYPE(__first));
}
```
`make_heap`的作用正如其名，将一个现有数据转化成堆，具体方法是基于adjust_heap调整子树，然后在将重排的节点向前移，再调整。

# `priority_heap`
```Cpp
template <class _Tp, 
          class _Sequence __STL_DEPENDENT_DEFAULT_TMPL(vector<_Tp>), // priority_heap默认使用vector作为底层容器
          class _Compare
          __STL_DEPENDENT_DEFAULT_TMPL(less<typename _Sequence::value_type>) > // 使用less作为比较器，也就是max-heap
class priority_queue {

  // requirements:

  __STL_CLASS_REQUIRES(_Tp, _Assignable);
  __STL_CLASS_REQUIRES(_Sequence, _Sequence);
  __STL_CLASS_REQUIRES(_Sequence, _RandomAccessContainer);
  typedef typename _Sequence::value_type _Sequence_value_type;
  __STL_CLASS_REQUIRES_SAME_TYPE(_Tp, _Sequence_value_type);
  __STL_CLASS_BINARY_FUNCTION_CHECK(_Compare, bool, _Tp, _Tp);

public:
  typedef typename _Sequence::value_type      value_type;
  typedef typename _Sequence::size_type       size_type;
  typedef          _Sequence                  container_type;

  typedef typename _Sequence::reference       reference;
  typedef typename _Sequence::const_reference const_reference;
protected:
  _Sequence c;
  _Compare comp;
public:
  priority_queue() : c() {}
  explicit priority_queue(const _Compare& __x) :  c(), comp(__x) {}
  priority_queue(const _Compare& __x, const _Sequence& __s) 
    : c(__s), comp(__x) 
    { make_heap(c.begin(), c.end(), comp); }  // 都是先对容器c初始化，然后调用make_heap建立堆

#ifdef __STL_MEMBER_TEMPLATES
  template <class _InputIterator>
  priority_queue(_InputIterator __first, _InputIterator __last) 
    : c(__first, __last) { make_heap(c.begin(), c.end(), comp); }

  template <class _InputIterator>
  priority_queue(_InputIterator __first, 
                 _InputIterator __last, const _Compare& __x)
    : c(__first, __last), comp(__x) 
    { make_heap(c.begin(), c.end(), comp); }

  template <class _InputIterator>
  priority_queue(_InputIterator __first, _InputIterator __last,
                 const _Compare& __x, const _Sequence& __s)
  : c(__s), comp(__x)
  { 
    c.insert(c.end(), __first, __last);
    make_heap(c.begin(), c.end(), comp);
  }

#else /* __STL_MEMBER_TEMPLATES */
  priority_queue(const value_type* __first, const value_type* __last) 
    : c(__first, __last) { make_heap(c.begin(), c.end(), comp); }

  priority_queue(const value_type* __first, const value_type* __last, 
                 const _Compare& __x) 
    : c(__first, __last), comp(__x)
    { make_heap(c.begin(), c.end(), comp); }

  priority_queue(const value_type* __first, const value_type* __last, 
                 const _Compare& __x, const _Sequence& __c)
    : c(__c), comp(__x) 
  { 
    c.insert(c.end(), __first, __last);
    make_heap(c.begin(), c.end(), comp);
  }
#endif /* __STL_MEMBER_TEMPLATES */

  bool empty() const { return c.empty(); }
  size_type size() const { return c.size(); }
  const_reference top() const { return c.front(); }
  void push(const value_type& __x) {
    __STL_TRY {
      c.push_back(__x);   // 和前面heap的介绍一样，先push到尾部，再用push_heap调整堆
      push_heap(c.begin(), c.end(), comp);
    }
    __STL_UNWIND(c.clear());
  }
  void pop() {
    __STL_TRY {
      pop_heap(c.begin(), c.end(), comp);  // 先将要取出的元素放到尾部
      c.pop_back(); // 再弹出
    }
    __STL_UNWIND(c.clear());
  }
};
```

根据上面源码，priority_heap使用vector作为容器，使用less操作符，因此是一个max-heap，priority_heap的构造函数都是先对容器进行构造，然后在调用make_heap构造堆。

[source issue](https://github.com/quinnwencn/blog/issues/95)
