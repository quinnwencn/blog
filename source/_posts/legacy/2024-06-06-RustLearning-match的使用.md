---
title: "[RustLearning] match的使用"
date: 2024-06-06 00:00:00
tags:
  - "Rust"
categories:
  - "Rust"
---

在Rust中，match是一個非常便利的語法，使用得當可以大大減少代碼複雜度，也方便閱讀。match的使用主要以以下幾個場景爲主：
1. 匹配枚舉值
```Rust
#[derive(Debug)] // so we can inspect the state in a minute
enum UsState {
    Alabama,
    Alaska,
    // --snip--
}

enum Coin {
    Penny,
    Nickel,
    Dime,
    Quarter(UsState),
}

fn value_in_cents(coin: Coin) -> u8 {
    match coin {
        Coin::Penny => 1,
        Coin::Nickel => 5,
        Coin::Dime => 10,
        Coin::Quarter(state) => {
            println!("State quarter from {:?}!", state);
            25
        }
    }
}
```
2. 匹配Option<T>
```Rust
    fn plus_one(x: Option<i32>) -> Option<i32> {
        match x {
            None => None,
            Some(i) => Some(i + 1),
        }
    }

    let five = Some(5);
    let six = plus_one(five);
    let none = plus_one(None);

```
3. 匹配常量
```Rust
    let dice_roll = 9;
    match dice_roll {
        3 => add_fancy_hat(),
        7 => remove_fancy_hat(),
        other => move_player(other),
    }

    fn add_fancy_hat() {}
    fn remove_fancy_hat() {}
    fn move_player(num_spaces: u8) {}
```
使用match有一個限製：必須覆蓋所有分支！上述例子中無論是枚舉、Option<T>還是常量，都覆蓋了所有分支，對於其他分支，通常是使用下劃線`_`標識，表示其餘所有情況。在匹配變量時，有一種用法，結合if語句使用：
```Rust
fn print_according_to_len(n: u16) -> String {
    match n {
        t if t % 3 == 0 ==> format!("{} can be divided by 3", t),
        t if t % 5 == 0 ==> format!("{} can be divided by 5", t),
        _ => format!("{} can''t  be divided by either 3 or 5", t),
    }
}
```

[source issue](https://github.com/quinnwencn/blog/issues/38)
