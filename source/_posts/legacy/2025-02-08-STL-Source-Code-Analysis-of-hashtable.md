---
title: "[STL] Source Code Analysis of hashtable"
date: 2025-02-08 00:00:00
tags:
  - "C/C++"
  - "STL"
  - "SGI"
categories:
  - "Systems C++"
---

基于红黑树的set和map容器，可以实现查找、插入和删除都是Log(N)的复杂度，对于普通场景已经足够用了。但是，如果考虑需要常数操作时间的容器，红黑树结构是无法满足需求的。能实现常数查找的容器，目前接触到的是数组（vector或者是array），但是数组的删除却是O(N)的复杂度。hash table在插入、删除和查找操作上都能实现常数级别的复杂度操作，它的实现以统计为基础。STL中的unordered_set和unordered_map都是以hashtable为底层实现的容器，实现了查找、插入和删除常数级别操作的功能。
hashtable是一种对键存储和操作的容器（unordered_set可以看做键和值一样），因此可以认为是一种字典结构的数据结构，hashtable最重要的函数就是一个将键映射到实际存储为止的函数，叫hash function（散列函数），散列函数将存储对象的键映射到数组的索引上（hashtable底层存储实际上是数组），从而实现了常数级别的存储。在删除时，只会将对应索引的数组元素设置为invalid，不会像数组一样删除，因此也是常数级别的删除操作。问题在于，因为数组是有大小的，比如是TotalSize，不同存储对象的键经过散列函数处理后，可能得到同一个数组索引，也就是哈希碰撞。
# 哈希碰撞
当不同存储对象的键经过散列函数处理后的到同一个数组索引，就发生了哈希碰撞。处理哈希碰撞的方法常见的有以下几种：
* 线性探测
* 二次探测
* 开链法

介绍解决哈希碰撞问题前，有一个概念需要了解下：负载系数（loading factor），指的是元素的个数除以数组的容量，因此负载系数一般都在0和1之间，除了开链策略。
## 线性探测 (Linear probing)
线性探测指的是，当一个存储对象经过散列函数计算后的索引已经存储了对象，那么就在数组大小的有限空间内向右侧寻找可用的空间（如果到达了数组尾部，再从数组头部开始查找）：

![Image](https://github.com/user-attachments/assets/9a24d651-7950-48eb-bafa-c0a2fa69c7c9)
上图的散列函数就是对数除以10取余，可以看到，虽然采用了散列函数，但是还是会出现最坏的情况，即插入的位置始终有值，因此实际上就退化成了O(N)插入。这种大片连续使用的索引被称为primary clustering，primary clustering导致新插入数据只能不断向前搜寻，不断解决碰撞问题，同时又扩大了primary clustering的影响，简直是恶性循环。

## 二次探测(Quadratic probing)
二次探测的提出就是为了解决primary clustering的问题，它的命名是因为解决碰撞的方程式就是一个二次方程： $F(i) = i^2$ ，当发生碰撞时，i以1为基准递增，查找可以使用的索引: $targetIndex = H + F(i)$ ，而不是向线性探测一样 $targetIndex = H + i$ ，探测过程如下所示：
![Image](https://github.com/user-attachments/assets/02426550-019c-4ea5-9801-5107b04602d0)

但是，不管是线性探测还是二次探测，都需要动态增加底层数组的大小，可以通过跟踪负载系数，当负载系数大于0.5时，就扩容。二次探测也有自己的问题，比如多个存储对象的散列值一样，那么每次的探测索引都一样，如果这样的值较多，那就是缩小版的primary clustering问题，也叫secondary clustering。

## 开链
开链策略是在每个数组元素中存储一个链表地址，每次散列函数计算后，就将值插入到对应的链表中，这样在插入或者查找时，只需要遍历链表即可。如果链表不长，速度依然不慢。不过此时的负载系数就会大于1，何时扩大数组就是一个问题。STL的 hashtable使用的就是开链法，我们接下来就要窥探STL hashtable的实现。

# STL的hashtable
## hashtable 的桶bucket和节点
![Image](https://github.com/user-attachments/assets/8379ac4d-294f-4acd-898d-794ffde72ee0)

STL的hashtable是以开链策略完成的，上图形象的描述了开链的实现，我们先看hashtable节点的定义：
```Cpp
template <class _Val>
struct _Hashtable_node
{
  _Hashtable_node* _M_next;
  _Val _M_val;
};  
```
可以看到，hashtable的节点实际上是一个链表，这也就是开链的做法。在stl的hashtable中，存储hashtable的数组叫做桶，每个桶中存储了一个hashtable 节点，也就是链表。

## hashtable的迭代器
```Cpp
template <class _Val, class _Key, class _HashFcn,
          class _ExtractKey, class _EqualKey, class _Alloc>
struct _Hashtable_iterator {
  typedef hashtable<_Val,_Key,_HashFcn,_ExtractKey,_EqualKey,_Alloc>
          _Hashtable;
  typedef _Hashtable_iterator<_Val, _Key, _HashFcn, 
                              _ExtractKey, _EqualKey, _Alloc>
          iterator;
  typedef _Hashtable_const_iterator<_Val, _Key, _HashFcn, 
                                    _ExtractKey, _EqualKey, _Alloc>
          const_iterator;
  typedef _Hashtable_node<_Val> _Node;

  typedef forward_iterator_tag iterator_category;
  typedef _Val value_type;
  typedef ptrdiff_t difference_type;
  typedef size_t size_type;
  typedef _Val& reference;
  typedef _Val* pointer;

  _Node* _M_cur;  // 记录当前迭代器所在的节点
  _Hashtable* _M_ht; // 记录当前迭代器的hashtable归属

  _Hashtable_iterator(_Node* __n, _Hashtable* __tab) 
    : _M_cur(__n), _M_ht(__tab) {}
  _Hashtable_iterator() {}
  reference operator*() const { return _M_cur->_M_val; }
#ifndef __SGI_STL_NO_ARROW_OPERATOR
  pointer operator->() const { return &(operator*()); }
#endif /* __SGI_STL_NO_ARROW_OPERATOR */
  iterator& operator++(); // forward iterator的递增，可能需要从一个bucket跳到另一个bucket
  iterator operator++(int);
  bool operator==(const iterator& __it) const
    { return _M_cur == __it._M_cur; }
  bool operator!=(const iterator& __it) const
    { return _M_cur != __it._M_cur; }
};
```
可以看到，hashtable的迭代器不仅需要记录当前迭代器的位置，还需要记录这个迭代器归属于那个hashtable，因为在迭代器操作中，可能需要从一个桶跳到另一个桶，这就涉及到operator++了。hashtable的迭代器是一个forward iterator，为什么呢？因为链表只能单向递增！所以也就只有operator ++，没有operator--。operator++的实现如下：
```Cpp
template <class _Val, class _Key, class _HF, class _ExK, class _EqK, 
          class _All>
_Hashtable_iterator<_Val,_Key,_HF,_ExK,_EqK,_All>&
_Hashtable_iterator<_Val,_Key,_HF,_ExK,_EqK,_All>::operator++()
{
  const _Node* __old = _M_cur;  // 记录之前所指向的节点
  _M_cur = _M_cur->_M_next; // 令cur指向cur的next，如果next不是空，那就证明不需要跳跃bucket，直接返回即可
  if (!_M_cur) { // 当前桶已经遍历完了， 需要根据旧节点的值计算出当前桶的索引，然后递增桶索引知道找到一个不为空的桶
    size_type __bucket = _M_ht->_M_bkt_num(__old->_M_val); // 这就是上述的计算旧节点的桶索引
    while (!_M_cur && ++__bucket < _M_ht->_M_buckets.size())  // cur为空代表是空桶，继续向前计算，但是这里有个疑问，当桶索引遍历完还是没有时，返回的是空，是不是符合预期呢（对应end()?）
      _M_cur = _M_ht->_M_buckets[__bucket];
  }
  return *this;
}
```
const iterator只是限制了修改，因此不再赘述。

## hashtable的数据结构
```Cpp
template <class _Val, class _Key, class _HashFcn,
          class _ExtractKey, class _EqualKey, class _Alloc>
class hashtable {
public:
  typedef _Key key_type;
  typedef _Val value_type;
  typedef _HashFcn hasher; 
  typedef _EqualKey key_equal;

  typedef size_t            size_type;
  typedef ptrdiff_t         difference_type;
  typedef value_type*       pointer;
  typedef const value_type* const_pointer;
  typedef value_type&       reference;
  typedef const value_type& const_reference;

  hasher hash_funct() const { return _M_hash; }
  key_equal key_eq() const { return _M_equals; }

private:
  typedef _Hashtable_node<_Val> _Node; // 节点，bucket存储的类型

#ifdef __STL_USE_STD_ALLOCATORS
public:
  typedef typename _Alloc_traits<_Val,_Alloc>::allocator_type allocator_type;
  allocator_type get_allocator() const { return _M_node_allocator; }
private:
  typename _Alloc_traits<_Node, _Alloc>::allocator_type _M_node_allocator;
  _Node* _M_get_node() { return _M_node_allocator.allocate(1); }
  void _M_put_node(_Node* __p) { _M_node_allocator.deallocate(__p, 1); }
# define __HASH_ALLOC_INIT(__a) _M_node_allocator(__a), 
#else /* __STL_USE_STD_ALLOCATORS */
public:
  typedef _Alloc allocator_type;
  allocator_type get_allocator() const { return allocator_type(); } 
private:
  typedef simple_alloc<_Node, _Alloc> _M_node_allocator_type;
  _Node* _M_get_node() { return _M_node_allocator_type::allocate(1); }
  void _M_put_node(_Node* __p) { _M_node_allocator_type::deallocate(__p, 1); }
# define __HASH_ALLOC_INIT(__a)
#endif /* __STL_USE_STD_ALLOCATORS */

private:
  hasher                _M_hash;  // 散列函数，支持用户自定义
  key_equal             _M_equals; // 判断相等函数，支持用户定义
  _ExtractKey           _M_get_key; 
  vector<_Node*,_Alloc> _M_buckets; // 这就是hashtable的桶了，底层采用vector实现，存储类型是hashtable节点的指针
  size_type             _M_num_elements; // 有效桶的数目，即装有节点的桶的数量
//...
```
关键成员的含义在上述代码中标注了，模板参数单独说明：
* _Val： 节点的值类型
* _Key： 节点的键类型（键和值不一样，键指的是用于计算散列值的输入，值是键对应的值）
* _HashFcn： 散列函数
* _ExtractKey：从节点中取出键的方法
* _EqualKey：键相等的判断方法
* _Alloc：内存分配管理器，默认使用std::alloc

在`stl_hash_fun.h`中已经有多个预定义的hash function，如果需要自定义散列函数，可以参照定义：
```Cpp
template <class _Key> struct hash { };
__STL_TEMPLATE_NULL struct hash<char*>
{
  size_t operator()(const char* __s) const { return __stl_hash_string(__s); }
};
```
`stl_hash_fun.h`中定义了模板类hash，并根据不同类型进行了特化，我们自定义类型只需要进行特化即可，如：
```Cpp
struct Data {
std::string name;
uint8_t age;
}


struct hash<Data> {
size_t operator()(Data data) const {
    return __stl_hash_string(data.name.data()) + age;
}
};
```
stl的hashtable的桶的大小，采用的是质数，并且预设了28个大小，以便扩容时使用：
```Cpp
// Note: assumes long is at least 32 bits.
enum { __stl_num_primes = 28 };

static const unsigned long __stl_prime_list[__stl_num_primes] =
{
  53ul,         97ul,         193ul,       389ul,       769ul,
  1543ul,       3079ul,       6151ul,      12289ul,     24593ul,
  49157ul,      98317ul,      196613ul,    393241ul,    786433ul,
  1572869ul,    3145739ul,    6291469ul,   12582917ul,  25165843ul,
  50331653ul,   100663319ul,  201326611ul, 402653189ul, 805306457ul, 
  1610612741ul, 3221225473ul, 4294967291ul
};

inline unsigned long __stl_next_prime(unsigned long __n)
{
  const unsigned long* __first = __stl_prime_list;
  const unsigned long* __last = __stl_prime_list + (int)__stl_num_primes;
  const unsigned long* pos = lower_bound(__first, __last, __n);
  return pos == __last ? *(__last - 1) : *pos;
}
```

## hashtable的插入
hashtable的插入可能涉及到resize: 和红黑树一样，hashtable提供了`insert_unique`和`insert_equal`两种方法：
```Cpp
  pair<iterator, bool> insert_unique(const value_type& __obj)
  {
    resize(_M_num_elements + 1);
    return insert_unique_noresize(__obj);
  }

  iterator insert_equal(const value_type& __obj)
  {
    resize(_M_num_elements + 1);
    return insert_equal_noresize(__obj);
  }
```
resize的定义如下：
```Cpp
template <class _Val, class _Key, class _HF, class _Ex, class _Eq, class _All>
void hashtable<_Val,_Key,_HF,_Ex,_Eq,_All>
  ::resize(size_type __num_elements_hint)
{
  const size_type __old_n = _M_buckets.size(); // 桶容量
  if (__num_elements_hint > __old_n) { // 有效桶 + 1是否大于桶容量
    const size_type __n = _M_next_size(__num_elements_hint);
    if (__n > __old_n) {  // 有效桶+1对应的桶容量比当前的桶容量还大，那必须扩容了
      vector<_Node*, _All> __tmp(__n, (_Node*)(0),
                                 _M_buckets.get_allocator()); // 新申请buckets
      __STL_TRY {
        for (size_type __bucket = 0; __bucket < __old_n; ++__bucket) {
          _Node* __first = _M_buckets[__bucket];
          while (__first) {  // 跳过空桶
            size_type __new_bucket = _M_bkt_num(__first->_M_val, __n);  // 根据新申请的buckets大小确定搬移节点的桶索引
            _M_buckets[__bucket] = __first->_M_next;
            __first->_M_next = __tmp[__new_bucket];
            __tmp[__new_bucket] = __first;
            __first = _M_buckets[__bucket];          
          }
        }
        _M_buckets.swap(__tmp); // 搬完在swap
      }
#         ifdef __STL_USE_EXCEPTIONS
      catch(...) {  // 出现异常就需要把新申请的桶全部释放
        for (size_type __bucket = 0; __bucket < __tmp.size(); ++__bucket) {
          while (__tmp[__bucket]) {
            _Node* __next = __tmp[__bucket]->_M_next;
            _M_delete_node(__tmp[__bucket]);
            __tmp[__bucket] = __next;
          }
        }
        throw;
      }
#         endif /* __STL_USE_EXCEPTIONS */
    }
  }
}
```
只有当下一次的有效桶数目比当前的bucket的size大，并且已经跨越到下一个桶大小时，hashtable才会进行扩大桶。

真正的插入操作：
### insert_unique_noresize
```Cpp
template <class _Val, class _Key, class _HF, class _Ex, class _Eq, class _All>
pair<typename hashtable<_Val,_Key,_HF,_Ex,_Eq,_All>::iterator, bool> 
hashtable<_Val,_Key,_HF,_Ex,_Eq,_All>
  ::insert_unique_noresize(const value_type& __obj)
{
  const size_type __n = _M_bkt_num(__obj); // 先根据值计算桶索引
  _Node* __first = _M_buckets[__n]; // 

 // 如果已经有值了，返回插入失败，和值对应的迭代器
  for (_Node* __cur = __first; __cur; __cur = __cur->_M_next) 
    if (_M_equals(_M_get_key(__cur->_M_val), _M_get_key(__obj)))
      return pair<iterator, bool>(iterator(__cur, this), false);

  _Node* __tmp = _M_new_node(__obj);  // 否则就创建节点
  __tmp->_M_next = __first; // 注意，新插入的节点，直接插到了链表头
  _M_buckets[__n] = __tmp;
  ++_M_num_elements; // 增加节点数目
  return pair<iterator, bool>(iterator(__tmp, this), true);
}
```

### insert_equal_noresize
```Cpp
template <class _Val, class _Key, class _HF, class _Ex, class _Eq, class _All>
typename hashtable<_Val,_Key,_HF,_Ex,_Eq,_All>::iterator 
hashtable<_Val,_Key,_HF,_Ex,_Eq,_All>
  ::insert_equal_noresize(const value_type& __obj)
{
  const size_type __n = _M_bkt_num(__obj); // 同样是先计算桶索引
  _Node* __first = _M_buckets[__n];

  for (_Node* __cur = __first; __cur; __cur = __cur->_M_next) 
    if (_M_equals(_M_get_key(__cur->_M_val), _M_get_key(__obj))) {
      _Node* __tmp = _M_new_node(__obj); // 如果有相同的值，就在已有值的下一个节点插入
      __tmp->_M_next = __cur->_M_next;
      __cur->_M_next = __tmp;
      ++_M_num_elements;
      return iterator(__tmp, this);
    }

  _Node* __tmp = _M_new_node(__obj); // 否则在链表头插入
  __tmp->_M_next = __first;
  _M_buckets[__n] = __tmp;
  ++_M_num_elements;
  return iterator(__tmp, this);
}
```

## hashtable删除节点
```Cpp
template <class _Val, class _Key, class _HF, class _Ex, class _Eq, class _All>
typename hashtable<_Val,_Key,_HF,_Ex,_Eq,_All>::size_type 
hashtable<_Val,_Key,_HF,_Ex,_Eq,_All>::erase(const key_type& __key)
{
  const size_type __n = _M_bkt_num_key(__key);
  _Node* __first = _M_buckets[__n];
  size_type __erased = 0;

  if (__first) {
    _Node* __cur = __first;
    _Node* __next = __cur->_M_next; // 从桶索引对应的桶的第二个链表节点开始查找删除
    while (__next) {
      if (_M_equals(_M_get_key(__next->_M_val), __key)) {
        __cur->_M_next = __next->_M_next;
        _M_delete_node(__next);
        __next = __cur->_M_next;
        ++__erased;
        --_M_num_elements;
      }
      else {
        __cur = __next;
        __next = __cur->_M_next;
      }
    }
    if (_M_equals(_M_get_key(__first->_M_val), __key)) {  // 最后再把链表头情况处理下
      _M_buckets[__n] = __first->_M_next;
      _M_delete_node(__first);
      ++__erased;
      --_M_num_elements;
    }
  }
  return __erased;
}
```
删除key对应的节点时，因为可能存在多个节点，所以stl的做法时，找到key对应的桶索引，然后从第二个节点开始，超找key，找到就删掉；最后一个情况，如果第一个节点也是key对应的，那就把第一个节点删掉，桶存储下一个节点。之所以从第二个开始删，是为了避免从第一个开始，有多个节点匹配，这样就需要多次改变桶第一个指向的元素。

[source issue](https://github.com/quinnwencn/blog/issues/106)
