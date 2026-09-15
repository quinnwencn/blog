---
title: "[RustLearning][Crypto] Diffie-Hellman算法"
date: 2024-06-11 00:00:00
tags:
  - "ARMv8"
  - "Crypto"
  - "Rust"
categories:
  - "Rust"
---

今天做的是一道Diffie-Hellman算法的简化题，Exercism的题目连接在这里：[Diffie-Hellman](https://exercism.org/tracks/rust/exercises/diffie-hellman)。题目的描述如下：
1. 测试用例中选取了两个素数P和G
2. 通信发起的一方Alice选择一个大于1小于P的数a，作为Alice的私钥；Bob以同样的方式选择一个私钥b
3. Alice按照以下公式计算她的公钥: $A = G^a mod P$
4. Bob也按照上述公式计算公钥： $B=G^b mod P$ 
5. 双方交换公钥，并计算通信私钥，对于Allice而言： $S = B^a mod P$, 对于Bob而言： $S=A^b  mod  P$
Diffie-Hellman算法的定义参考[Wikipedia - Diffie-Hellman](https://zh.wikipedia.org/zh-hans/%E8%BF%AA%E8%8F%B2-%E8%B5%AB%E7%88%BE%E6%9B%BC%E5%AF%86%E9%91%B0%E4%BA%A4%E6%8F%9B)
Diffie-Hellman算法的安全性在于有限域内的离散数学难题。
这道题的解法如下：
```Rust
use rand::Rng;

pub fn private_key(p: u64) -> u64 {
    let mut rng = rand::thread_rng();
    rng.gen_range(2..p)
}

pub fn public_key(p: u64, g: u64, a: u64) -> u64 {
    mod_exp(g, a, p)
}

pub fn secret(p: u64, b_pub: u64, a: u64) -> u64 {
    mod_exp(b_pub, a, p)
}

fn mod_exp(base: u64, exponent: u64, modulus: u64) -> u64 {
    let mut result: u128 = 1;
    let mut exp = exponent;
    let mut b = base as u128;
    let m = modulus as u128;

    while exp > 0 {
        if exp % 2 == 1 {
            result = (result * b) % m;
        }

        exp /= 2;
        b = (b * b) % m;
    }

    result as u64
}






[package]
edition = "2021"
name = "diffie-hellman"
version = "0.1.0"

[dependencies]
rand = "0.8.3"

[features]
big-primes = []
```

[source issue](https://github.com/quinnwencn/blog/issues/40)
