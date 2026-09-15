---
title: "[STL] Source Code Analysis of shared_ptr"
date: 2025-02-10 00:00:00
tags:
  - "C/C++"
  - "STL"
categories:
  - "Systems C++"
---

在没有智能指针之前，C++因为内存管理的问题经常被诟病，一不小心就一个内存泄漏或者乱踩内存，这对于大型项目而言简直就是灾难。C++委员会也意识到了这个问题，在C++11版本中推出了shared_ptr和unique_ptr两种智能指针。unique_ptr是一个独占所有权的只能指针，无法通过拷贝的方式复制，只能通过move转移控制权，unique_ptr智能指针在离开作用域时，会自动析构释放内存，正确使用不会导致内存泄漏问题（不正确使用可能会导致非法访问内存）。shared_ptr是一个内置引用计数，多个shared_ptr可以指向同一个内存，并由shared_ptr管理引用计数，只有当引用计数为0时才会自动释放shared_ptr所指向的内存。

## shared_ptr的数据结构
![Image](https://github.com/user-attachments/assets/52f98d74-7928-4081-be4a-c7e3c41c25c5)

shared_ptr的数据结构可以简单用上述的图表示，但是，RefCount block并不是一个单独的成员，而是一片内存，其中不仅存储了引用计数，还有其他对象，我们会在随后的介绍中展开。本文分析的源码来自g++ 9.4.0版本。

## shared_ptr定义
在使用shared_ptr时，我们需要包含memory头文件，但是，shared_ptr并不在memory头文件中，而是通过在memory头文件中`#  include <bits/shared_ptr.h>`的方式引入，shared_ptr的定义就在这个文件中：
```Cpp
template<typename _Tp>
    class shared_ptr : public __shared_ptr<_Tp>
    {
// ...
constexpr shared_ptr() noexcept : __shared_ptr<_Tp>() { }

shared_ptr(const shared_ptr&) noexcept = default;

template<typename _Yp, typename = _Constructible<_Yp*>>
	explicit
	shared_ptr(_Yp* __p) : __shared_ptr<_Tp>(__p) { }

template<typename _Yp, typename _Deleter,
	       typename = _Constructible<_Yp*, _Deleter>>
	shared_ptr(_Yp* __p, _Deleter __d)
        : __shared_ptr<_Tp>(__p, std::move(__d)) { }

 template<typename _Yp, typename _Deleter, typename _Alloc,
	       typename = _Constructible<_Yp*, _Deleter, _Alloc>>
	shared_ptr(_Yp* __p, _Deleter __d, _Alloc __a)
	: __shared_ptr<_Tp>(__p, std::move(__d), std::move(__a)) { }

// ...
private:
      // This constructor is non-standard, it is used by allocate_shared.
      template<typename _Alloc, typename... _Args>
	shared_ptr(_Sp_alloc_shared_tag<_Alloc> __tag, _Args&&... __args)
	: __shared_ptr<_Tp>(__tag, std::forward<_Args>(__args)...)
	{ }
// ...
};
```
从代码中可以看出，shared_ptr类自身并没有定义实现，而是public继承自__shared_ptr: `class shared_ptr : public __shared_ptr<_Tp>`。`__shared_ptr`才是最终实现shared_ptr逻辑的类。但是，有几个构造函数需要特别注意：
* shared_ptr(_Yp* __p)
* shared_ptr(_Yp* __p, _Deleter __d)
* shared_ptr(_Sp_alloc_shared_tag<_Alloc> __tag, _Args&&... __args)

这几个构造函数，决定了底层引用计数所使用的类型，这里先提一个醒，后续展开介绍。我们先看`__shared_ptr`的实现。

### __shared_ptr
`__shared_ptr`定义在`bits/shared_ptr_base.h`中，定义如下：
```Cpp
  template<typename _Tp, _Lock_policy _Lp>
    class __shared_ptr
    : public __shared_ptr_access<_Tp, _Lp> {
// ...
explicit
	__shared_ptr(_Yp* __p)
	: _M_ptr(__p), _M_refcount(__p, typename is_array<_Tp>::type())
       {
	  static_assert( !is_void<_Yp>::value, "incomplete type" );
	  static_assert( sizeof(_Yp) > 0, "incomplete type" );
	  _M_enable_shared_from_this_with(__p);
	}

      template<typename _Yp, typename _Deleter, typename = _SafeConv<_Yp>>
	__shared_ptr(_Yp* __p, _Deleter __d)
	: _M_ptr(__p), _M_refcount(__p, std::move(__d))
	{
	  static_assert(__is_invocable<_Deleter&, _Yp*&>::value,
	      "deleter expression d(p) is well-formed");
	  _M_enable_shared_from_this_with(__p);
	}

protected:
      // This constructor is non-standard, it is used by allocate_shared.
      template<typename _Alloc, typename... _Args>
	__shared_ptr(_Sp_alloc_shared_tag<_Alloc> __tag, _Args&&... __args)
	: _M_ptr(), _M_refcount(_M_ptr, __tag, std::forward<_Args>(__args)...)
	{ _M_enable_shared_from_this_with(_M_ptr); }

// ...
    __shared_ptr(const __shared_ptr&) noexcept = default;
      __shared_ptr& operator=(const __shared_ptr&) noexcept = default;
      ~__shared_ptr() = default;  // 注意，这里析构函数并没有释放内存，要关注内存是在哪里释放的

// ...
      __shared_ptr&
      operator=(__shared_ptr&& __r) noexcept
      {
	__shared_ptr(std::move(__r)).swap(*this);  // 所有的赋值操作都是根据参数构造一个对象后和this swap
	return *this;
      }

      template<class _Yp>
	_Assignable<_Yp>
	operator=(__shared_ptr<_Yp, _Lp>&& __r) noexcept
	{
	  __shared_ptr(std::move(__r)).swap(*this);
	  return *this;
	}

      template<typename _Yp, typename _Del>
	_UniqAssignable<_Yp, _Del>
	operator=(unique_ptr<_Yp, _Del>&& __r)
	{
	  __shared_ptr(std::move(__r)).swap(*this);
	  return *this;
	}

      void
      reset() noexcept
      { __shared_ptr().swap(*this); }

      template<typename _Yp>
	_SafeConv<_Yp>
	reset(_Yp* __p) // _Yp must be complete.
	{
	  // Catch self-reset errors.
	  __glibcxx_assert(__p == 0 || __p != _M_ptr);
	  __shared_ptr(__p).swap(*this);
	}

      template<typename _Yp, typename _Deleter>
	_SafeConv<_Yp>
	reset(_Yp* __p, _Deleter __d)
	{ __shared_ptr(__p, std::move(__d)).swap(*this); }

element_type*
      get() const noexcept
      { return _M_ptr; } // 获取裸指针并不会增加计数或者减少计数，但是使用裸指针时需要注意生命周期管理，不建议获取裸指针后赋值给类似的裸指针

     element_type*	   _M_ptr;         // Contained pointer.  指向实际的对象内存
      __shared_count<_Lp>  _M_refcount;    // Reference counter.
};
```
由上述源码中可以看出，`__shared_ptr`也是提供了几种类型的构造函数，上述代码中，我把需要关注的三个类型展示出来了，`shared_ptr`中也是三个与之对应的构造函数，这三个类型的构造函数，在后面对Reference counter的分析时，才能看出作用。此时能看出的是是否提供deletor以及是否是可变参的而已。
其他一些需要关注的点，代码中通过注释的方式进行了标注。
继续关注`__shared_ptr`的成员：
* _M_ptr：指向对象的内存，也就是实际使用的指针
* _M_refcount：引用计数，类型是__shared_count

### _shared_count
```Cpp
template<_Lock_policy _Lp>
    class __shared_count
    {
      template<typename _Tp>
	struct __not_alloc_shared_tag { using type = void; };

      template<typename _Tp>
	struct __not_alloc_shared_tag<_Sp_alloc_shared_tag<_Tp>> { };

    public:
      constexpr __shared_count() noexcept : _M_pi(0)
      { }

      template<typename _Ptr>
        explicit
	__shared_count(_Ptr __p) : _M_pi(0) // 对应__shared_ptr的构造函数
	{
	  __try
	    {
	      _M_pi = new _Sp_counted_ptr<_Ptr, _Lp>(__p);
	    }
	  __catch(...)
	    {
	      delete __p;
	      __throw_exception_again;
	    }
	}

     // ...

     template<typename _Ptr, typename _Deleter,
	       typename = typename __not_alloc_shared_tag<_Deleter>::type>
	__shared_count(_Ptr __p, _Deleter __d)  // 对应__shared_ptr的构造函数
	: __shared_count(__p, std::move(__d), allocator<void>())
	{ }

      template<typename _Ptr, typename _Deleter, typename _Alloc,
	       typename = typename __not_alloc_shared_tag<_Deleter>::type>
	__shared_count(_Ptr __p, _Deleter __d, _Alloc __a) : _M_pi(0)
	{
	  typedef _Sp_counted_deleter<_Ptr, _Deleter, _Alloc, _Lp> _Sp_cd_type;
	  __try
	    {
	      typename _Sp_cd_type::__allocator_type __a2(__a);
	      auto __guard = std::__allocate_guarded(__a2);
	      _Sp_cd_type* __mem = __guard.get();
	      ::new (__mem) _Sp_cd_type(__p, std::move(__d), std::move(__a));
	      _M_pi = __mem;
	      __guard = nullptr;
	    }
	  __catch(...)
	    {
	      __d(__p); // Call _Deleter on __p.
	      __throw_exception_again;
	    }
	}

      template<typename _Tp, typename _Alloc, typename... _Args>
	__shared_count(_Tp*& __p, _Sp_alloc_shared_tag<_Alloc> __a,
		       _Args&&... __args) // 对应__shared_ptr的构造函数
	{
	  typedef _Sp_counted_ptr_inplace<_Tp, _Alloc, _Lp> _Sp_cp_type;
	  typename _Sp_cp_type::__allocator_type __a2(__a._M_a);
	  auto __guard = std::__allocate_guarded(__a2);
	  _Sp_cp_type* __mem = __guard.get();
	  auto __pi = ::new (__mem)
	    _Sp_cp_type(__a._M_a, std::forward<_Args>(__args)...);
	  __guard = nullptr;
	  _M_pi = __pi;
	  __p = __pi->_M_ptr();
	}

~__shared_count() noexcept
      {
	if (_M_pi != nullptr)
	  _M_pi->_M_release(); // 调用引用计数递减函数
      }

// ...
__shared_count(const __shared_count& __r) noexcept  // 拷贝构造函数，
      : _M_pi(__r._M_pi) 
      {
	if (_M_pi != 0) // 这种情况怎么会发生，如果__r不是nullptr， 那么__r._M_pi应该不会是空指针
	  _M_pi->_M_add_ref_copy();  // 增加计数
      }

      __shared_count&
      operator=(const __shared_count& __r) noexcept  // 拷贝赋值
      {
	_Sp_counted_base<_Lp>* __tmp = __r._M_pi;
	if (__tmp != _M_pi) // 排除 a = a的情
	  {
	    if (__tmp != 0)
	      __tmp->_M_add_ref_copy(); // 先增加右边的指针的计数
	    if (_M_pi != 0) // 如果是0，就不用减少计数了
	      _M_pi->_M_release(); // 再减少左边的指针的计数
	    _M_pi = __tmp;
	  }
	return *this;
      }

// ...
private:
      friend class __weak_count<_Lp>;

      _Sp_counted_base<_Lp>*  _M_pi; // 只有一个成员
    };
```
`__shared_count`中的构造函数，也和`__shared_ptr`中的构造函数对应，因为`__shared_ptr`最终也需要调用`__shared_count`的构造函数来构造引用计数成员。`__shared_count`中的拷贝赋值和拷贝构造函数中， 有对应引用计数的管理，实际上这些引用计数都是_M_pi，也就是`_Sp_counted_base`提供的功能。
成员 `_M_pi` 的类型是`_Sp_counted_base`，这是一个抽象类，内部有函数是纯虚函数，有三个类继承实现了`_Sp_counted_base`，它们分别是：
* _Sp_counted_ptr
* _Sp_counted_deleter
* _Sp_counted_ptr_inplace
他们就是实现`shared_ptr`引用计数的核心类，接下来将对这四个类单独介绍.

### 引用计数分析
####  _Sp_counted_base
`_Sp_counted_base` 是一个基类，但是其内部已经包含了引用计数所需的计数器，并且是同时包含了weak_ptr的计数器：
```Cpp
  template<_Lock_policy _Lp = __default_lock_policy>
    class _Sp_counted_base
    : public _Mutex_base<_Lp>
    {
    public:
      _Sp_counted_base() noexcept
      : _M_use_count(1), _M_weak_count(1) { }

      virtual
      ~_Sp_counted_base() noexcept
      { }

      // Called when _M_use_count drops to zero, to release the resources
      // managed by *this.
      virtual void
      _M_dispose() noexcept = 0; // 纯虚函数，留给实现类定义，当_M_use_count 变成0时调用，释放资源

      // Called when _M_weak_count drops to zero.
      virtual void
      _M_destroy() noexcept // 当_M_weak_count 变成0时释放，这个释放是delete this，需要关注和dispose的区别
      { delete this; } 

      virtual void*
      _M_get_deleter(const std::type_info&) noexcept = 0; // 由于可能会自定义删除器，因此这个函数必须是纯虚函数

      void
      _M_add_ref_copy()
      { __gnu_cxx::__atomic_add_dispatch(&_M_use_count, 1); } // 原子操作+1

      void
      _M_add_ref_lock(); // 使用锁递增

      bool
      _M_add_ref_lock_nothrow();   // 使用锁递增, 不抛异常

      void
      _M_release() noexcept // 递减引用计数，可能会释放内存
      {
        // Be race-detector-friendly.  For more info see bits/c++config.
        _GLIBCXX_SYNCHRONIZATION_HAPPENS_BEFORE(&_M_use_count);
	if (__gnu_cxx::__exchange_and_add_dispatch(&_M_use_count, -1) == 1) // 如果当前是1，那没必要减了，直接调用dispose释放内存
	  {
            _GLIBCXX_SYNCHRONIZATION_HAPPENS_AFTER(&_M_use_count);
	    _M_dispose();
	    // There must be a memory barrier between dispose() and destroy()
	    // to ensure that the effects of dispose() are observed in the
	    // thread that runs destroy().
	    // See http://gcc.gnu.org/ml/libstdc++/2005-11/msg00136.html
	    if (_Mutex_base<_Lp>::_S_need_barriers)
	      {
		__atomic_thread_fence (__ATOMIC_ACQ_REL);
	      }

            // Be race-detector-friendly.  For more info see bits/c++config.
            _GLIBCXX_SYNCHRONIZATION_HAPPENS_BEFORE(&_M_weak_count);
	    if (__gnu_cxx::__exchange_and_add_dispatch(&_M_weak_count,  // weak count也要递减，如果递减后也是0，也要调用destroy摧毁this
						       -1) == 1)
              {
                _GLIBCXX_SYNCHRONIZATION_HAPPENS_AFTER(&_M_weak_count);
	        _M_destroy();
              }
	  }
      }

      void
      _M_weak_add_ref() noexcept  // 递减weak 引用计数
      { __gnu_cxx::__atomic_add_dispatch(&_M_weak_count, 1); }

      void
      _M_weak_release() noexcept  // 为什么还有weak 引用计数的release，难道是专门处理weak_ptr的？但这时候不是也会摧毁this了吗？
      {
        // Be race-detector-friendly. For more info see bits/c++config.
        _GLIBCXX_SYNCHRONIZATION_HAPPENS_BEFORE(&_M_weak_count);
	if (__gnu_cxx::__exchange_and_add_dispatch(&_M_weak_count, -1) == 1)
	  {
            _GLIBCXX_SYNCHRONIZATION_HAPPENS_AFTER(&_M_weak_count);
	    if (_Mutex_base<_Lp>::_S_need_barriers)
	      {
	        // See _M_release(),
	        // destroy() must observe results of dispose()
		__atomic_thread_fence (__ATOMIC_ACQ_REL);
	      }
	    _M_destroy();
	  }
      }

      long
      _M_get_use_count() const noexcept
      {
        // No memory barrier is used here so there is no synchronization
        // with other threads.
        return __atomic_load_n(&_M_use_count, __ATOMIC_RELAXED);
      }

    private:
      _Sp_counted_base(_Sp_counted_base const&) = delete;
      _Sp_counted_base& operator=(_Sp_counted_base const&) = delete;

      _Atomic_word  _M_use_count;     // #shared
      _Atomic_word  _M_weak_count;    // #weak + (#shared != 0)
    };
```
`_Sp_counted_base`中有两个成员，分别是shared_ptr的引用计数和weak_ptr的引用计数，也就是说实际上这两个指针的引用计数使用的是同一个类维护，递增和递减也是由`_Sp_counted_base`维护，递增和递减都是原子操作。
类中的模板函数，都会根据锁或者原子操作进行特化或者片特化处理，这里不赘述。

#### _Sp_counted_ptr
`_Sp_counted_ptr` 继承自`_Sp_counted_base`，目的是托管那些只使用shared_ptr管理内存指针，不自定义deleter或者其他操作的shared_ptr，因此其内部必须有一个指向托管对象内存的指针，我们来看源码：
```Cpp
  template<typename _Ptr, _Lock_policy _Lp>
    class _Sp_counted_ptr final : public _Sp_counted_base<_Lp>
    {
    public:
      explicit
      _Sp_counted_ptr(_Ptr __p) noexcept
      : _M_ptr(__p) { }

      virtual void
      _M_dispose() noexcept // dispose的实现是释放指向托管对象内存的指针
      { delete _M_ptr; }

      virtual void
      _M_destroy() noexcept
      { delete this; } // 这个和base一样，释放自身

      virtual void*
      _M_get_deleter(const std::type_info&) noexcept
      { return nullptr; } // _Sp_counted_ptr 不支持自定义deleter

      _Sp_counted_ptr(const _Sp_counted_ptr&) = delete;
      _Sp_counted_ptr& operator=(const _Sp_counted_ptr&) = delete;

    private:
      _Ptr             _M_ptr; // 指向托管对象的内存
    };
```
可以看出，`_Sp_counted_ptr`只是对dispose虚函数和_M_get_deleter进行了实现，然后新增一个指向托管对象内存的指针成员，这个成员也是依赖于`_M_dispose`释放资源，根据前面的描述，这个函数会在`__shared_count`析构函数被调用，因此也就释放了。由于`_Sp_counted_base`是在`__shared_count`中通过new操作符申请的，因此需要用delete this释放资源。

##### `_Sp_counted_ptr`的使用场景
```Cpp
auto sptr = std::shared_ptr<Data>(new Data);
```

#### _Sp_counted_deleter
在介绍`_Sp_counted_deleter`之前，先介绍下空基类的一些知识，因为`_Sp_counted_deleter`需要使用到空基类。在C++中，任何对象都需要有地址，但是，如果一个类没有任何数据成员，为了确定他的地址，编译器会在实现时，增加1字节的空间，用来占位表示这个变量的地址；而如果这个空类被用作基类（Empty Base Object, EBO)，编译器此时就可以将这个空类的空间改为0，从而优化节省空间。
```Cpp
template<int _Nm, typename _Tp,
	   bool __use_ebo = !__is_final(_Tp) && __is_empty(_Tp)> // 当_Tp不是final类且是空类时，它是EBO，将_Tp视为基类；如果_Tp不是空类，不适用EBO，将_Tp作为成员变量

  /// Specialization using EBO.
  template<int _Nm, typename _Tp>
    struct _Sp_ebo_helper<_Nm, _Tp, true> : private _Tp // 当做基类继承，使用private继承
    {
      explicit _Sp_ebo_helper(const _Tp& __tp) : _Tp(__tp) { }
      explicit _Sp_ebo_helper(_Tp&& __tp) : _Tp(std::move(__tp)) { }

      static _Tp&
      _S_get(_Sp_ebo_helper& __eboh) { return static_cast<_Tp&>(__eboh); }
    };

  /// Specialization not using EBO.
  template<int _Nm, typename _Tp>
    struct _Sp_ebo_helper<_Nm, _Tp, false>
    {
      explicit _Sp_ebo_helper(const _Tp& __tp) : _M_tp(__tp) { }  // 当做成员变量
      explicit _Sp_ebo_helper(_Tp&& __tp) : _M_tp(std::move(__tp)) { }

      static _Tp&
      _S_get(_Sp_ebo_helper& __eboh)
      { return __eboh._M_tp; }

    private:
      _Tp _M_tp;
    };
```
在`_Sp_counted_deleter`中，ebo用上了, 以便优化deleter和allo的存储空间，避免这两个是空类时浪费额外的空间
```Cpp

  // Support for custom deleter and/or allocator
  template<typename _Ptr, typename _Deleter, typename _Alloc, _Lock_policy _Lp>
    class _Sp_counted_deleter final : public _Sp_counted_base<_Lp>
    {
      class _Impl : _Sp_ebo_helper<0, _Deleter>, _Sp_ebo_helper<1, _Alloc> // 这里就自动根据_Deleter和_Alloc的类型，决定使用ebo还是不适用ebo
      {
	typedef _Sp_ebo_helper<0, _Deleter>	_Del_base;
	typedef _Sp_ebo_helper<1, _Alloc>	_Alloc_base;

      public:
	_Impl(_Ptr __p, _Deleter __d, const _Alloc& __a) noexcept
	: _M_ptr(__p), _Del_base(std::move(__d)), _Alloc_base(__a)
	{ }

	_Deleter& _M_del() noexcept { return _Del_base::_S_get(*this); } // 根据是否是ebo决定获取类还是成员，真巧妙啊！
	_Alloc& _M_alloc() noexcept { return _Alloc_base::_S_get(*this); }

	_Ptr _M_ptr;  // 托管对象的内存指针
      };

    public:
      using __allocator_type = __alloc_rebind<_Alloc, _Sp_counted_deleter>;

      // __d(__p) must not throw.
      _Sp_counted_deleter(_Ptr __p, _Deleter __d) noexcept
      : _M_impl(__p, std::move(__d), _Alloc()) { }

      // __d(__p) must not throw.
      _Sp_counted_deleter(_Ptr __p, _Deleter __d, const _Alloc& __a) noexcept
      : _M_impl(__p, std::move(__d), __a) { }

      ~_Sp_counted_deleter() noexcept { } // 没有释放任何内存，因为没有申请内存

      virtual void
      _M_dispose() noexcept
      { _M_impl._M_del()(_M_impl._M_ptr); }  // 由于托管对象的指针放到了impl中，因此dispose时，就需要使用impl保存的deleter来释放impl的_M_ptr

      virtual void
      _M_destroy() noexcept
      {
	__allocator_type __a(_M_impl._M_alloc());
	__allocated_ptr<__allocator_type> __guard_ptr{ __a, this };
	this->~_Sp_counted_deleter();  // 这里释放的时候，实际上没有释放内存，因为_Sp_counted_deleter的this指针实际上是栈上数据，但是因为impl._M_ptr是对上数据，因此需要在dispose时释放，这个非常巧妙
      }

      virtual void*
      _M_get_deleter(const std::type_info& __ti) noexcept
      {
#if __cpp_rtti
	// _GLIBCXX_RESOLVE_LIB_DEFECTS
	// 2400. shared_ptr's get_deleter() should use addressof()
        return __ti == typeid(_Deleter)
	  ? std::__addressof(_M_impl._M_del())
	  : nullptr; // 返回的是deleter的地址，如果是ebo，那么就是impl的地址里的deleter，否则就是变量的地址，真是巧妙啊
#else
        return nullptr;
#endif
      }

    private:
      _Impl _M_impl;
    };
```
`_Sp_counted_deleter`首先使用EBO的概念，将deleter和alloc的存储空间优化了，尽可能地减少对内存的使用，实现起来就是基于一个Impl类托管_M_ptr，继承自deleter和alloc，从而使用了EBO的技术。
`_Sp_counted_deleter`也实现了dispose和destroy，dispose只是根据`_Sp_counted_deleter`释放的是impl._M_ptr，没有什么特别的，比较有意思的是destroy。destroy的实现单独拿出来看：
```Cpp
      virtual void
      _M_destroy() noexcept
      {
	__allocator_type __a(_M_impl._M_alloc()); // 从impl中获取分配器 
	__allocated_ptr<__allocator_type> __guard_ptr{ __a, this }; // 然后构造一个__alloc_rebind类型的__allocated_ptr，__allocated_ptr会在析构时，如果第二个指针参数不为空，就调用deallocate释放
	this->~_Sp_counted_deleter(); // 释放资源
      }
```
归结起来就是：
* 获取分配器：
    * __allocator_type __a(_M_impl._M_alloc()); 从 _Impl 中获取存储的自定义分配器。
    * __allocator_type 是通过 __alloc_rebind 定义的，确保分配器可以用于分配 _Sp_counted_deleter 类型的内存。

* 使用 __allocated_ptr 管理内存：
    * __allocated_ptr<__allocator_type> __guard_ptr{ __a, this }; 创建了一个 __allocated_ptr 对象，用于管理 _Sp_counted_deleter 的内存。
    * __allocated_ptr 是一个 RAII 包装器，确保在析构时正确地释放内存。

* 调用析构函数：
    * this->~_Sp_counted_deleter(); 显式调用 _Sp_counted_deleter 的析构函数，销毁对象。

我们来看`__shared_count`中，`_Sp_counted_deleter`是如何申请内存的：
```Cpp
template<typename _Ptr, typename _Deleter, typename _Alloc,
	       typename = typename __not_alloc_shared_tag<_Deleter>::type>
	__shared_count(_Ptr __p, _Deleter __d, _Alloc __a) : _M_pi(0)
	{
	  typedef _Sp_counted_deleter<_Ptr, _Deleter, _Alloc, _Lp> _Sp_cd_type;
	  __try
	    {
	      typename _Sp_cd_type::__allocator_type __a2(__a); // 创建新的内存分配器
	      auto __guard = std::__allocate_guarded(__a2); // 这里就申请内存了
	      _Sp_cd_type* __mem = __guard.get(); // 获取申请的内存
	      ::new (__mem) _Sp_cd_type(__p, std::move(__d), std::move(__a)); // 在申请的内存上使用placement new构造_Sp_counted_deleter
	      _M_pi = __mem;
	      __guard = nullptr;
	    }
	  __catch(...)
	    {
	      __d(__p); // Call _Deleter on __p.
	      __throw_exception_again;
	    }
	}
```
为了申请和释放一致，因此在destroy中也是用同样的方式，由__allocated_ptr来释放_Sp_counted_deleter的内存。

##### _Sp_counted_deleter的使用场景
```Cpp
void delData* data) { delete data; }

std::shared_ptr<Data>(new Data, del);
```

#### `_Sp_counted_ptr_inplace`
`_Sp_counted_ptr_inplace`和其他两个相比，内存申请时引用计数和托管的对象内存是同时申请的，因此具有更高的效率，主要用于make_shared场景， 源码如下：
```Cpp
template<typename _Tp, typename _Alloc, _Lock_policy _Lp>
    class _Sp_counted_ptr_inplace final : public _Sp_counted_base<_Lp>
    {
      class _Impl : _Sp_ebo_helper<0, _Alloc>  // 同样是使用EBO技术，试图节省内存
      {
	typedef _Sp_ebo_helper<0, _Alloc>	_A_base; 

      public:
	explicit _Impl(_Alloc __a) noexcept : _A_base(__a) { }

	_Alloc& _M_alloc() noexcept { return _A_base::_S_get(*this); }

	__gnu_cxx::__aligned_buffer<_Tp> _M_storage;  // 对其托管对象的内存缓冲区，用来申请引用计数以及托管对象的内存
      };

    public:
      using __allocator_type = __alloc_rebind<_Alloc, _Sp_counted_ptr_inplace>;

      // Alloc parameter is not a reference so doesn't alias anything in __args
      template<typename... _Args>
	_Sp_counted_ptr_inplace(_Alloc __a, _Args&&... __args)
	: _M_impl(__a)
	{
	  // _GLIBCXX_RESOLVE_LIB_DEFECTS
	  // 2070.  allocate_shared should use allocator_traits<A>::construct
	  allocator_traits<_Alloc>::construct(__a, _M_ptr(),  // 对申请好的内存就地构造
	      std::forward<_Args>(__args)...); // might throw
	}

      ~_Sp_counted_ptr_inplace() noexcept { }

      virtual void
      _M_dispose() noexcept
      {
	allocator_traits<_Alloc>::destroy(_M_impl._M_alloc(), _M_ptr()); // 析构内存， 释放内存放到了destroy
      }

      // Override because the allocator needs to know the dynamic type
      virtual void
      _M_destroy() noexcept
      {
	__allocator_type __a(_M_impl._M_alloc());
	__allocated_ptr<__allocator_type> __guard_ptr{ __a, this };
	this->~_Sp_counted_ptr_inplace(); // 和_Sp_counted_deleter相同的技术实现释放内存
      }

    private:
      friend class __shared_count<_Lp>; // To be able to call _M_ptr().

      // No longer used, but code compiled against old libstdc++ headers
      // might still call it from __shared_ptr ctor to get the pointer out.
      virtual void*
      _M_get_deleter(const std::type_info& __ti) noexcept override  // deleter根据make shared技术返回，还没展开看
      {
	auto __ptr = const_cast<typename remove_cv<_Tp>::type*>(_M_ptr());
	// Check for the fake type_info first, so we don't try to access it
	// as a real type_info object. Otherwise, check if it's the real
	// type_info for this class. With RTTI enabled we can check directly,
	// or call a library function to do it.
	if (&__ti == &_Sp_make_shared_tag::_S_ti()
	    ||
#if __cpp_rtti
	    __ti == typeid(_Sp_make_shared_tag)
#else
	    _Sp_make_shared_tag::_S_eq(__ti)
#endif
	   )
	  return __ptr;
	return nullptr;
      }


      _Tp* _M_ptr() noexcept { return _M_impl._M_storage._M_ptr(); }  // 获取托管对象的指针

      _Impl _M_impl;
    };
```
`_Sp_counted_ptr_inplace`的内存申请和`_Sp_counted_deleter`的内存申请类似，但是，参数有所不同：
```Cpp
 // 位于__shared_count中
      template<typename _Tp, typename _Alloc, typename... _Args>
	__shared_count(_Tp*& __p, _Sp_alloc_shared_tag<_Alloc> __a,  // 注意，这里的__p是引用，也就是说实际上内存管理是在_Sp_counted_ptr_inplace中， 外部没有申请内存，只是用而已
		       _Args&&... __args)
	{
	  typedef _Sp_counted_ptr_inplace<_Tp, _Alloc, _Lp> _Sp_cp_type;  
	  typename _Sp_cp_type::__allocator_type __a2(__a._M_a);  // 生成分配器
	  auto __guard = std::__allocate_guarded(__a2); // 这里已经申请内存了
	  _Sp_cp_type* __mem = __guard.get(); //  获取申请的内存
	  auto __pi = ::new (__mem)
	    _Sp_cp_type(__a._M_a, std::forward<_Args>(__args)...);  // 构造_Sp_counted_ptr_inplace
	  __guard = nullptr;
	  _M_pi = __pi;
	  __p = __pi->_M_ptr();
	}
```
可以看到，这里的托管对象指针是一个引用，因为要使用`_Sp_counted_ptr_inplace`来申请内存，外部没申请内存，其他的申请和构造和`_Sp_counted_deleter`类似。要了解`_Sp_counted_ptr_inplace`的内存申请原理，我们通过上面`_Sp_counted_ptr_inplace`的定义，先了解它的成员：
* _Sp_counted_base：引用计数控制块
* _M_impl：内部实现类，含有一个对齐数组内存：`__gnu_cxx::__aligned_buffer<_Tp> _M_storage`， Impl的实现是继承自一个EBO，满足EBO基类。
所以，`_Sp_counted_ptr_inplace`的内存大小可以由下列式子计算：
```
sizeof(_Sp_counted_ptr_inplace<_Tp, _Alloc, _Lp>) = 
    sizeof(std::_Sp_counted_base) + 
    sizeof(_Alloc) + 
    sizeof(_Tp) + 
    对齐填充
```
其中，`_Alloc`使用的是std::allocator，因此是空的，所以内存就变成了：
```
sizeof(_Sp_counted_ptr_inplace<_Tp, _Alloc, _Lp>) = 
    sizeof(std::_Sp_counted_base) + 
    sizeof(_Tp) + 
    对齐填充
```
其中，`_TP`是一个`__gnu_cxx::__aligned_buffer<_Tp>`类型的数据，实际上是一个数组，提供对齐存储能力，为`_TP`对象提供一块对齐的内存空间。对齐的实现可以简化为：
```Cpp
template<typename _Tp>
struct __aligned_buffer {
    alignas(_Tp) unsigned char _M_storage[sizeof(_Tp)];

    void* _M_addr() noexcept { return static_cast<void*>(_M_storage); }
    const void* _M_addr() const noexcept { return static_cast<const void*>(_M_storage); }
};
```
通过这种方式提供的实际上是一片未被初始化的内存，而不是直接构造`_Tp`对象，这样可以延缓对象的构造，方便后面使用placement new进行构造。
了解这些后，我们重新看`_Sp_counted_ptr_inplace`的内存申请和构造，内存申请发生在：`auto __guard = std::__allocate_guarded(__a2);`，这时候申请的内存是没有构造的内存，申请的内存包括了`_Tp`和基类`_Sp_counted_base`的两个引用计数，然后再通过placement new进行构造：`auto __pi = ::new (__mem)
_Sp_cp_type(__a._M_a, std::forward<_Args>(__args)...); `，此时，基类的引用计数和`_Tp`都被构造完成。

##### _Sp_counted_ptr_inplace的使用场景
```Cpp
auto sptr = std::make_shared<Data>(1, "demo");

sptr->xxx
```

[source issue](https://github.com/quinnwencn/blog/issues/110)
