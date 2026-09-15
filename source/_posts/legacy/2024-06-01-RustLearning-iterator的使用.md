---
title: "[RustLearning] iterator的使用"
date: 2024-06-01 00:00:00
tags:
  - "Exercism"
  - "Rust"
categories:
  - "Rust"
---

<p>Rust中的迭代器功能非常強大，但是掌握並熟悉使用迭代器是一個漫長的過程，尤其是對熟悉了C++再學習的人，會經常以C++的方式寫一些循環代碼。這裏我藉著Exercism上的一道題，來熟悉迭代器的使用，後續如果有新的迭代器不熟悉的，也在這個issue上補充。迭代器的<a href="https://doc.rust-lang.org/std/iter/trait.Iterator.html">官方文檔</a>也是非常有用的手冊！
</p>
<p>這次的Exorcism的題目是<a href="https://exercism.org/tracks/rust/exercises/luhn">Luhn</a>， 判斷一串數字是否滿足Luhn算法的要求，銀行卡、社保號碼等都滿足Luhn算法的要求。
</p>
<p>Luhn算法可以參考<a href="https://zh.wikipedia.org/wiki/%E5%8D%A2%E6%81%A9%E7%AE%97%E6%B3%95">維基百科的介紹</a>，要求簡單概括為以下：
</p>
<li>只包含數字和空格字符；
</li>
<li>數字字符總署要大於1；
</li>
<li>逆序遍歷數字字符，偶數位的數字字符double，如果double後結果大於9，則要減去9；
</li>
<li>將逆序遍歷後的數字求和，和的結果如果是10的倍數則合法，否則不合法。</li>
