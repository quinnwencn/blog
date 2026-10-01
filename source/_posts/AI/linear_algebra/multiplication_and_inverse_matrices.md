---
title: 矩阵乘法与逆矩阵
date: 2026-10-01 12:00:00
tags:
  - linear algebra
  - math
categories:
  - AI Infra
---

矩阵的乘法可以有多种理解：行乘以列、矩阵乘以列，行乘以矩阵，以及列乘以行。

## 行乘列

一个矩阵乘法 $AB = C$，可以理解为$C$的元素来源于$A$的行乘以$B$的列（dot product），即：

$$
C_{ik} = (Row_i of A)(Col_k of B)
$$

所以$C_{34} = RowA_3 * ColB_4$，行乘以列的到的就是各个元素的乘积之和，即：

$$
C_{34} = A_{31}*B_{14} + A_{32}*B_{24}... = \sum_1^nA_{3i}B_{i4}
$$

## 矩阵乘以列

在[线性方程的几何表示](https://quinnwencn.github.io/blog/2026/09/15/AI/linear_algebra/the_geometry_of_linear_equations/)中，我们讨论过一个矩阵乘以列，得到的就是一个列,因此我们可以用$A$矩阵，乘以$B$矩阵的每一列，从而得到矩阵$C$:

$$
C_i = A * (Col_iofB)
$$

## 行乘以矩阵

在[线性方程的几何表示](https://quinnwencn.github.io/blog/2026/09/15/AI/linear_algebra/the_geometry_of_linear_equations/)中，我们同样讨论过行乘以矩阵，得到的是一个行，因此如果用A矩阵的每一行，乘以B矩阵，就得到了矩阵C：

$$
C_i = (Row_iofA) * B
$$

## 列乘以行

我们假设$AB=C$中，$A$是mx1，$B$是1xp，那么$C$就是mxp,比如：

$$
\begin{bmatrix}2\\3\\4\end{bmatrix}\begin{bmatrix}1& 6\end{bmatrix}
= \begin{bmatrix}2& 12\\3& 18\\4& 24\end{bmatrix}
$$

那么如果$A$，$B$和$C$是矩阵，那么就有：

$$
C = \sum_{i=1}^{n}Col_{A_i}Row_{B_i}
$$

即A的第一列乘以B的第一行，加上A的第二列乘以B的第二行....

以上的几个方法，都建立在$A$的列数等于$B$的行数的基础上。

## Inverse矩阵（逆矩阵）

我们先讨论存在Inverse矩阵的情况，对于一个矩阵$A$，如果存在某个矩阵$B$ 使得$BA = I$或者$AB = I$，其中$I$是所有对角线元素全为1，其他元素全为0的矩阵，那么$B$ 就是$A$ 的Inverse矩阵，可以用$A^{-1}$表示，即:

$$
A^{-1}A = I
$$

那什么时候一个矩阵没有Inverse矩阵呢？也就是矩阵不存在唯一解的情况（多项式方程组不存在解）。

我们对存在Inverse矩阵的情况做一个例子，比如$A=\begin{bmatrix}1& 3\\ 2& 7\end{bmatrix}$， 存在逆矩阵$\begin{bmatrix}a& b\\ c& d\end{bmatrix}$, 满足

$$
\begin{bmatrix}1& 3\\ 2& 7\end{bmatrix}\begin{bmatrix}a& b\\ c& d\end{bmatrix}
=\begin{bmatrix}1& 0\\ 0& 1\end{bmatrix}
$$



从矩阵乘以列的角度，我们会得到两个方程组：

$$
A * Col_jof A^{-1} = Col_jofI
$$

Gauss-Jordan有一个方法来求解这样的方程组，他把A和I组合在一起，然后来求解：

$$
\begin{bmatrix}1& 3& 1& 0\\2& 7& 0& 1\end{bmatrix}
$$

这个矩阵相当于$A|I$，然后我们目标是将方程组变成$I|A^{-1}$，也就是要做一次消元法：

1. 首先消去第二行的2:第二行减去第一行乘以2，得到

$$
\begin{bmatrix}1& 3& 1& 0\\0& 1& -2& 1\end{bmatrix}
$$

2. 消去第一行的3: 第一行减去第二行乘以3，得到

$$
\begin{bmatrix}1& 0& 7& -3\\0& 1& -2& 1\end{bmatrix}
$$

然后我们就能得出$A^{-1} = \begin{bmatrix}7& -3\\ -2& 1\end{bmatrix}$ ，即
$$
E\begin{bmatrix}A& I\end{bmatrix} = \begin{bmatrix}I& ?\end{bmatrix}
$$
由于$EA=I$，因此$E=A^{-1}$，而任何矩阵与$I$相乘都等于自身，于是$EI=E=A^{-1}$，于是有：
$$
E\begin{bmatrix}A& I\end{bmatrix} = \begin{bmatrix}I& A^{-1}\end{bmatrix}
$$
