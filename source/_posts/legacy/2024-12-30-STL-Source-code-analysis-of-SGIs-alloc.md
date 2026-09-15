---
title: "[STL] Source code analysis of SGI's alloc"
date: 2024-12-30 00:00:00
tags:
  - "C/C++"
  - "STL"
categories:
  - "Systems C++"
---

在使用STL的过程中，我们几乎接触不到Allocator，原因是STL的容器都使用了默认的Allocator，例如：
```Cpp
template<
    class T,
    class Allocator = [std::allocator](http://en.cppreference.com/w/cpp/memory/allocator)<T>

> class vector;
```
但是，如果要了解STL的底层原理，Allocator却是必须第一个了解的模块，它为STL的容器分配和管理内存。
# Allocator的标准接口
STL标准规范中规定了Allocator的接口，任何想要实现STL标准库的组织或个人，都必须按照这些接口实现Allocator，以便STL的容器可以正常使用：
```
allocator::value_type
allocator::pointer
allocator::const_pointer
allocator::reference
allocator::const_reference
allocator::size_type
allocator::difference_type
allocator::rebind
allocator::allocator()
allocator::allocator(const allocator&)
allocator::template <class U> allocator::allocator(const allocator<U>&)
allocator::~allocator()
pointer allocator::address() const
const_pointer allocator::address() const
pointer allocator::allocate(size_type n, const void* = 0)
void allocator::deallocate(pointer p, size_type n)
size_type allocator::max_size() const
void allocator::construct(pointer p, const T& val)
void allocator::destroy(pointer p)
```
# SGI的分级配置Allocator
虽然STL委员会要求Allocator必须满足上述要求，但是SGI的Allocator并不满足，SGI的Allocator名称是alloc，并且不接受参数，因此使用上和其他标准的Allocator也不一样：
```Cpp
std::vector<int, std::allocator<int>> arr;
std::vector<int, std::alloc> arr2;
```
虽然SGI也提供了一个和STL标准一样的allocator，但是它仅仅是对operator new和operator delete的封装，没有额外的性能优化，因此从学习的角度，还是更推荐学习SGI的alloc。
## SGI Allocator的构造和析构
construct使用的是placement new方法，即在已经分配的内存上，构造一个对象：
```Cpp
template <class _T1, class _T2>
inline void _Construct(_T1* __p, const _T2& __value) {
  new ((void*) __p) _T1(__value);
}
```
相比于construct，destroy的处理更为复杂，目的是为了提高性能和效率。原因也很简单，对于内置类型，或者说是trivial type，析构的必要性就显得没那么重要，比如char， int，uint32_t的析构其实并没有必要，但是对于struct以及class，我们却不能忽略析构，否则可能造成内存泄露等问题。为了区分trivial和non-trivial两种类型的析构，destroy提供了重载版本：
```Cpp
template <class T>
inline void destroy(T* pointer) {
    pointer->~T();
}

template <class ForwardIterator>
inline void destroy(ForwardIterator first, ForwardIterator last) {
    __destroy(first, last, value_type(first));
}

template <class ForwardIterator, class T>
inline void __destroy(ForwardIterator first, ForwardIterator last, T*) {
    typedef typename __type_traits<T>::has_trivial_destructor trivial_destructor;
    __destroy_aux(first, last, trivial_destructor());
}

// non-trivial type
template <ForwardIterator>
inline void __destroy(ForwardIterator first, ForwardIterator last, __false_type) {
    for (;first < last; ++first) {
        destroy(&*first);
    }
}

// trivial type
template <ForwardIterator>
inline void __destroy(ForwardIterator first, ForwardIterator last, __true_type) {}

// 特化
inline void _Destroy(char*, char*) {}
inline void _Destroy(int*, int*) {}
inline void _Destroy(long*, long*) {}
inline void _Destroy(float*, float*) {}
inline void _Destroy(double*, double*) {}
#ifdef __STL_HAS_WCHAR_T
inline void _Destroy(wchar_t*, wchar_t*) {}
#endif /* __STL_HAS_WCHAR_T */
```
用一张图来总结：
![image](https://github.com/user-attachments/assets/950531dd-66cf-49de-9531-1ed090642d8a)

## SGI Allocator内存分级管理
在libc中，当分配的内存大于128K时，使用mmap系统调用陷入内核申请内存；小于128K时使用brk进行内存申请；同时使用链表和内存池，对不同大小的内存分块进行管理，以提高内存申请的效率，详情查看[libc的malloc内存申请](https://github.com/quinnwencn/blog/issues/new)。
SGI的Allocator也使用了分级管理内存和内存池的策略，来提高程序申请内存的效率，同时兼顾多线程、内存不足以及内存碎片的问题。SGI的Allocator分为两级内存分配，一级内存分配使用的是malloc和free管理，次级内存分配基于自管理的内存池分配和释放。只有当申请的内存大小大于128字节时，才会调用一级内存分配，小于128字节时使用次级内存分配，这可以从源码中看出：
```Cpp
typedef __malloc_alloc_template<0> malloc_alloc;
//...
# ifdef __USE_MALLOC

typedef malloc_alloc alloc;
typedef malloc_alloc single_client_alloc;

# else
//...

typedef __default_alloc_template<__NODE_ALLOCATOR_THREADS, 0> alloc;
typedef __default_alloc_template<false, 0> single_client_alloc;
//...
#endif
```
默认配置alloc成`__default_alloc_template`，因为__USE_MALLOC没有被定义。其中`__malloc_alloc_template`就是一级内存分配，`__default_alloc_template`是次级内存分配。alloc并不直接提供给STL的容器使用，而是通过封装了一个`simple_alloc`给STL使用：
```Cpp
template<class _Tp, class _Alloc>
class simple_alloc {

public:
    static _Tp* allocate(size_t __n)
      { return 0 == __n ? 0 : (_Tp*) _Alloc::allocate(__n * sizeof (_Tp)); }
    static _Tp* allocate(void)
      { return (_Tp*) _Alloc::allocate(sizeof (_Tp)); }
    static void deallocate(_Tp* __p, size_t __n)
      { if (0 != __n) _Alloc::deallocate(__p, __n * sizeof (_Tp)); }
    static void deallocate(_Tp* __p)
      { _Alloc::deallocate(__p, sizeof (_Tp)); }
};
```
在SGI的容器中，使用方式是这样的：
```Cpp
template <class T, class Alloc = alloc>
class vector {
protected:
    typedef simple_alloc <value_type, Alloc> data_allocator;
//...
};
```
一级和次级内存分配的关系如下图：
![image](https://github.com/user-attachments/assets/33311911-52a5-4c19-9f06-ecabc70465cd)
![image](https://github.com/user-attachments/assets/4e359e62-b916-49e5-a459-8f28180a72d2)

### 一级内存分配（__malloc_alloc_template）
```Cpp
template <int __inst>
class __malloc_alloc_template {

private:
// 处理内存不足，oom：Out Of Memory
  static void* _S_oom_malloc(size_t);
  static void* _S_oom_realloc(void*, size_t);

#ifndef __STL_STATIC_TEMPLATE_MEMBER_BUG
  static void (* __malloc_alloc_oom_handler)();
#endif

public:

  static void* allocate(size_t __n)
  {
    void* __result = malloc(__n); // 一级内存分配申请内存使用的是libc的malloc
    if (0 == __result) __result = _S_oom_malloc(__n);  // 申请失败时，尝试通过oom再申请一次
    return __result;
  }

  static void deallocate(void* __p, size_t /* __n */)
  {
    free(__p);  // 与malloc对应，一级内存分配使用free释放内存
  }

  static void* reallocate(void* __p, size_t /* old_sz */, size_t __new_sz)
  {
    void* __result = realloc(__p, __new_sz);  // 一级内存分配
    if (0 == __result) __result = _S_oom_realloc(__p, __new_sz);
    return __result;
  }

  // 设置out of memory 的handler，在oom时使用，可以定制
  static void (* __set_malloc_handler(void (*__f)()))()  
  {
    void (* __old)() = __malloc_alloc_oom_handler;
    __malloc_alloc_oom_handler = __f;
    return(__old);
  }

};

#ifndef __STL_STATIC_TEMPLATE_MEMBER_BUG
template <int __inst>
void (* __malloc_alloc_template<__inst>::__malloc_alloc_oom_handler)() = 0;
#endif

template <int __inst>
void*
__malloc_alloc_template<__inst>::_S_oom_malloc(size_t __n)
{
    void (* __my_malloc_handler)();
    void* __result;

    for (;;) {
        __my_malloc_handler = __malloc_alloc_oom_handler;
        if (0 == __my_malloc_handler) { __THROW_BAD_ALLOC; }
        (*__my_malloc_handler)();
        __result = malloc(__n);
        if (__result) return(__result);
    }
}

template <int __inst>
void* __malloc_alloc_template<__inst>::_S_oom_realloc(void* __p, size_t __n)
{
    void (* __my_malloc_handler)();
    void* __result;

    for (;;) {
        __my_malloc_handler = __malloc_alloc_oom_handler;
        if (0 == __my_malloc_handler) { __THROW_BAD_ALLOC; }
        (*__my_malloc_handler)();
        __result = realloc(__p, __n);
        if (__result) return(__result);
    }
}

```
可以看到，一级内存分配使用libc的`malloc`, `realloc`, 和`frree`管理内存的申请、释放和重申请等操作，并支持设置oom处理函数，但是并不能使用c++的new-handler机制，因为申请内存时没有使用operator new。
C++的new handler机制提供了一种功能，当操作系统无法满足内存申请需求时，调用一个定制化的函数，然后才会抛出异常std::bad_alloc。

SGI的一级内存分配不通过operator new和operator delete来管理，可能是因为operator new的机制无法提供realloc的功能，或者是希望利用malloc的内存池？

### 次级内存分配 (__default_alloc_template)
次级内存分配使用了16个链表，分别维护8，16，24，32，40，48，56，64，72，80，88，96，104，112，120，128字节大小的内存分块，这也就是为什么大于128字节通过一级内存分配系统分配内存，而低于128字节，通过次级内存分配系统来分配内存。次级内存分配系统的链表和常见的数据结构中的链表不一样，采取和glibc的malloc一样的做法，即同一个地址既指向下一个节点，也用来存储内存数据，如下：
```Cpp
union obj {
       union obj* free_list_link;
       char client_data[1];
};
```
![image](https://github.com/user-attachments/assets/c858bd4e-9c30-43e6-afa2-2a954bfa7c89)
次级内存分配的实现如下：
```Cpp
#if defined(__SUNPRO_CC) || defined(__GNUC__)
// breaks if we make these template class members:
  enum {_ALIGN = 8};  // 次级内存分配系统的最小内存，也是分配时需要对齐的大小
  enum {_MAX_BYTES = 128};  // 次级内存分配的最大内存大小
  enum {_NFREELISTS = 16}; // _MAX_BYTES/_ALIGN   // 链表数
#endif

template <bool threads, int inst>
class __default_alloc_template {

private:
  // Really we should use static const int x = N
  // instead of enum { x = N }, but few compilers accept the former.
#if ! (defined(__SUNPRO_CC) || defined(__GNUC__))
    enum {_ALIGN = 8};
    enum {_MAX_BYTES = 128};
    enum {_NFREELISTS = 16}; // _MAX_BYTES/_ALIGN
# endif
  static size_t
  _S_round_up(size_t __bytes)    // 将分配的内存向上取整到8的倍数，以便放到对应的链表进行管理
    { return (((__bytes) + (size_t) _ALIGN-1) & ~((size_t) _ALIGN - 1)); }

__PRIVATE:
  union _Obj {
        union _Obj* _M_free_list_link;
        char _M_client_data[1];    /* The client sees this.        */
  };
private:
# if defined(__SUNPRO_CC) || defined(__GNUC__) || defined(__HP_aCC)
    static _Obj* __STL_VOLATILE _S_free_list[]; 
        // Specifying a size results in duplicate def for 4.1
# else
    static _Obj* __STL_VOLATILE _S_free_list[_NFREELISTS];  // 16个链表
# endif
  static  size_t _S_freelist_index(size_t __bytes) {  // 查找应该使用哪个链表
        return (((__bytes) + (size_t)_ALIGN-1)/(size_t)_ALIGN - 1);
  }

  // Returns an object of size __n, and optionally adds to size __n free list.
  static void* _S_refill(size_t __n); // 返回一个大小为n的内存块，可能将其他大小为_n的内存块加到free list
  // Allocates a chunk for nobjs of size size.  nobjs may be reduced
  // if it is inconvenient to allocate the requested number.
  static char* _S_chunk_alloc(size_t __size, int& __nobjs);  // 分配可以容纳nobjs个大小为__size的大空间，nobjs可能因为不方便配置而变小，言外之意可能没那么大？

  // Chunk allocation state.
  static char* _S_start_free;  // 内存池起始地址
  static char* _S_end_free;   // 内存池末端地址
  static size_t _S_heap_size;

# ifdef __STL_THREADS
    static _STL_mutex_lock _S_node_allocator_lock;
# endif

    // It would be nice to use _STL_auto_lock here.  But we
    // don't need the NULL check.  And we do need a test whether
    // threads have actually been started.
    class _Lock;
    friend class _Lock;
    class _Lock {
        public:
            _Lock() { __NODE_ALLOCATOR_LOCK; }
            ~_Lock() { __NODE_ALLOCATOR_UNLOCK; }
    };

public:

  /* __n must be > 0      */
  static void* allocate(size_t __n)
  {
    void* __ret = 0;

   // 如果要分配的内存大小大于128字节，从一级内存分配系统中进行分配，也就是用malloc去分配
    if (__n > (size_t) _MAX_BYTES) {
      __ret = malloc_alloc::allocate(__n);
    }
    else {  // 否则由次级内存分配系统分配
      _Obj* __STL_VOLATILE* __my_free_list
          = _S_free_list + _S_freelist_index(__n);
      // Acquire the lock here with a constructor call.
      // This ensures that it is released in exit or during stack
      // unwinding.
#     ifndef _NOTHREADS
      /*REFERENCED*/
      _Lock __lock_instance;
#     endif
      _Obj* __RESTRICT __result = *__my_free_list;
      if (__result == 0)  // 没有找到可用的free list，也有可能链表是空的，那就填充free list
        __ret = _S_refill(_S_round_up(__n));  
      else { 
 // 找到了n对应大小的链表，将链表头部第一块内存返回，并更新链表头指向去除内存块的下一块内存
        *__my_free_list = __result -> _M_free_list_link;
        __ret = __result;
      }
    }

    return __ret;
  };

  /* __p may not be 0 */
  static void deallocate(void* __p, size_t __n)  // 释放内存
  {
    if (__n > (size_t) _MAX_BYTES)   // 内存大小大于128字节，用一级内存分配系统释放，也就是free
      malloc_alloc::deallocate(__p, __n);
    else {
  // 内存小于128字节，用次级内存分配系统释放，先找到内存块对应的链表
      _Obj* __STL_VOLATILE*  __my_free_list
          = _S_free_list + _S_freelist_index(__n);
      _Obj* __q = (_Obj*)__p;

      // acquire lock
#       ifndef _NOTHREADS
      /*REFERENCED*/
      _Lock __lock_instance;
#       endif /* _NOTHREADS */
      __q -> _M_free_list_link = *__my_free_list;   // 这里不需要判断是否是空了，直接将当前释放的内存的下一块内存指向当前的链表头，并更新链表头为当前释放的内存块，O(1)复杂度
      *__my_free_list = __q;
      // lock is released here
    }
  }

  static void* reallocate(void* __p, size_t __old_sz, size_t __new_sz);

} ;
```
可以看到，不管是申请内存还是释放内存，次级内存分配都会先根据内存大小判断是使用一级内存分配还是次级内存分配，判断依据就是是否大于128字节。小于128字节时，不管是分配还是释放，都是O(1)复杂度，因为都是在链表头部插入和取出。
allocate函数对应的图：
![image](https://github.com/user-attachments/assets/79193d49-639a-4cd5-9719-82f7bb1baed1)

deallocate函数对应的图：
![image](https://github.com/user-attachments/assets/a50a4334-f6e8-403c-8e18-53d7378296e6)

重填冲函数(_S_refill)
```Cpp
template <bool __threads, int __inst>
void*
__default_alloc_template<__threads, __inst>::_S_refill(size_t __n)
{
    int __nobjs = 20;
    char* __chunk = _S_chunk_alloc(__n, __nobjs); // 尝试通过_S_chunk_alloc从内存池分配新空间，nobjs是20，也有可能因为内存池已经没有足够的空间，分配的小于20
    _Obj* __STL_VOLATILE* __my_free_list;
    _Obj* __result;
    _Obj* __current_obj;
    _Obj* __next_obj;
    int __i;

    if (1 == __nobjs) return(__chunk);  
     // 如果只分配了一块，证明空间只剩一块了，那就直接返回给用户使用，否则的话，
    // 获取n对应大小的链表，并将分配的内存块的第二块作为链表头，放入链表中，
   // 然后对剩下的内存块构建链表（因为分配出来的不是链表，我们待会看下_S_chunk_alloc是怎么分配的）
    __my_free_list = _S_free_list + _S_freelist_index(__n);

    /* Build free list in chunk */  // 将第一块返回，其他的构建链表
      __result = (_Obj*)__chunk;
      *__my_free_list = __next_obj = (_Obj*)(__chunk + __n);
      for (__i = 1; ; __i++) {  // 为啥通过break结束for loop，而不是设置停止条件呢，可能是为了减少重复代码吧
        __current_obj = __next_obj;
        __next_obj = (_Obj*)((char*)__next_obj + __n);
        if (__nobjs - 1 == __i) {
            __current_obj -> _M_free_list_link = 0;
            break;
        } else {
            __current_obj -> _M_free_list_link = __next_obj;
        }
      }
    return(__result);
}
```
可以看到，重填充函数会试图从内存池里分配20个n大小的块出来，并将第一块返回给用户使用，其他的放到n对应的链表中，以便下次再使用。但是，内存池中可能刚好只剩一块n大小的情况，这种情况就直接返回给用户使用，不需要进行链表操作。
接下来看看内存池分配函数_S_chunk_alloc:
```Cpp
/* We allocate memory in large chunks in order to avoid fragmenting     */
/* the malloc heap too much.                                            */
/* We assume that size is properly aligned.                             */
/* We hold the allocation lock.                                         */
template <bool __threads, int __inst>
char*
__default_alloc_template<__threads, __inst>::_S_chunk_alloc(size_t __size, 
                                                            int& __nobjs)
{
    char* __result;
    size_t __total_bytes = __size * __nobjs;  // 计算要分配的内存大小
    size_t __bytes_left = _S_end_free - _S_start_free;  // 内存池剩余大小

    if (__bytes_left >= __total_bytes) {  // 剩余空间足够大，那就切total bytes大小分配
        __result = _S_start_free;
        _S_start_free += __total_bytes;
        return(__result);
    } else if (__bytes_left >= __size) {  //  内存比要申请的小，但是大于等于一块，也就是说可以妥协下，少分配点，但是也能满足需求
        __nobjs = (int)(__bytes_left/__size);  // 根据内存池大小，缩小分配的个数，注意哦，__nobjs是引用类型
        __total_bytes = __size * __nobjs;
        __result = _S_start_free;
        _S_start_free += __total_bytes;  // 从start开始切除分配的空间
        return(__result);
    } else { // 没空间了，但不确定是不是一滴都没了
        size_t __bytes_to_get = 
	  2 * __total_bytes + _S_round_up(_S_heap_size >> 4);  // 重新申请内存池的大小是要申请的内存的两倍，同时加上堆空间的 1/16
        // Try to make use of the left-over piece.
        if (__bytes_left > 0) {  // 还有一点点？ 别浪费，看看能不能放到其他链表里
            _Obj* __STL_VOLATILE* __my_free_list =
                        _S_free_list + _S_freelist_index(__bytes_left);

            ((_Obj*)_S_start_free) -> _M_free_list_link = *__my_free_list;
            *__my_free_list = (_Obj*)_S_start_free;
        }
        _S_start_free = (char*)malloc(__bytes_to_get);  // 放完后，重新管malloc向系统申请内存池
        if (0 == _S_start_free) {  // 系统也一滴都没了！！！
            size_t __i;
            _Obj* __STL_VOLATILE* __my_free_list;
	    _Obj* __p;
            // Try to make do with what we have.  That can't
            // hurt.  We do not try smaller requests, since that tends
            // to result in disaster on multi-process machines.
            for (__i = __size;
                 __i <= (size_t) _MAX_BYTES;
                 __i += (size_t) _ALIGN) {  // 从size开始，到128字节的链表，找找看谁还富裕点，匀一匀给内存池吧
                __my_free_list = _S_free_list + _S_freelist_index(__i);
                __p = *__my_free_list;
                if (0 != __p) {
                    *__my_free_list = __p -> _M_free_list_link;
                    _S_start_free = (char*)__p;
                    _S_end_free = _S_start_free + __i;  // 找到了，内存池要到饭了，再装大爷给用户分一下
                    return(_S_chunk_alloc(__size, __nobjs));
                    // Any leftover piece will eventually make it to the
                    // right free list.
                }
            }

           // 如果走到这一步，地主家也没余粮了，系统、链表、内存池都干涸了，只能寄希望于一级内存分配系统，再试试了。
	    _S_end_free = 0;	// In case of exception.
            _S_start_free = (char*)malloc_alloc::allocate(__bytes_to_get);
            // This should either throw an
            // exception or remedy the situation.  Thus we assume it
            // succeeded.
        }

       //  一级内存分配系统分配出内存了，那么赶紧把内存池初始化下，再让用户来申请下。
        _S_heap_size += __bytes_to_get;
        _S_end_free = _S_start_free + __bytes_to_get;
        return(_S_chunk_alloc(__size, __nobjs));
    }
}
```
前面提到，重填冲函数会尝试去申请20块n大小的内存块，也就是大小为20n的内存，因此，内存池就有两种情况：
* 内存池大小超过20n： 直接分配20N大小的内存，然后调整内存池大小
* 内存池大小小于20n，此时有两种情况
  * 内存池小于20n，但是大于等于 n: 分配n的整数倍大小的内存给用户，并缩小内存池大小（这种情况就可能出现一个n的内存，因此重填冲要考虑这个情况）
  * 内存池小于n，一滴都没了！： 使用malloc分配2n + （堆大小的1/16 向上取整到8的倍数）的内存大小，把20n的内存返回给用户，其他的补充内存池。但是，如果malloc都失败了，系统也一滴都没了！！！这种情况可太极端了，那么就只能从已有的链表中，从size到最大的128字节的链表中，找一个能用的块，构造一个小一点的内存池，再尝试用_S_chunk_alloc分一下。如果链表也没有，就只能寄希望与一级内存分配，如果这也没有，那系统应该要抛出异常了。

内存池的操作可以参考下图，虽然他没有将内存池内部内存的分配细节介绍出来，但是仅仅看链表的操作也可以初探STL的次级内存分配系统的概况了：
![image](https://github.com/user-attachments/assets/08b06496-5f18-406c-8ebf-f31f1b392982)


# Reference 
1. 《STL源码剖析》 侯捷著
2. [SGI 源码仓库](https://github.com/karottc/sgi-stl)

[source issue](https://github.com/quinnwencn/blog/issues/87)
