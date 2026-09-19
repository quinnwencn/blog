---
title: 矩阵消元法
date: 2026-09-18 12:00:00
tags:
  - linear algebra
  - math
categories:
  - "AI Infra"
---

# 矩阵消元法

我们给出一个三元一次方程组：

$$
x + 2y + z = 2\\
3x + 8y + z = 12\\
4y +z = 2
$$

对于没学过线性代数的人而言，自然而然想到的就是消元法：

1. 通过第一第二个方程消去x；

2. 通过消去x的方程和第三个方程消去y；

3. 计算出z；

4. 根据方程3算出y；

5. 根据方程1或者方程2算出x。

整个方程组就可以计算出解了（如果存在解），线性代数的矩阵运算中，也是这样做的。

## 方程组的矩阵表示

根据$Ax=B$ 的矩阵乘法表示，我们可以得到两个矩阵：

$$
A = \begin{bmatrix}
1& 2& 1\\
3& 8& 1\\
0& 4& 1\end{bmatrix}
$$

$$
B = \begin{bmatrix}
2\\
12\\
2\end{bmatrix}
$$

同样采用消元法（Elimination），我们首先消除X，也就是把第二行减去，第一行乘以3，得到的矩阵是：

$$
A' = \begin{bmatrix}
1& 2& 1\\
0& 2& -2\\
0& 4& 1\end{bmatrix}
$$

这样，我们就得到了消去x的矩阵，我们再对A' 做一次消元运算，消去y后得到：

$$
A'' = \begin{bmatrix}
1& 2& 1\\
0& 2& -2\\
0& 0& 5\end{bmatrix}
$$

这样我们就得到三个pivots（1， 2， 5），我们也设定$U=A''$. 我们可以看出，如果pivots没有0，就意味着这个方程组是有解的，因此一个方程组有没有解，也能理解为能不能将其矩阵表示通过行运算的到一个pivots不含0的矩阵。

此时等号右边的B的变化如下：

$$
B: \begin{bmatrix}
2\\
12\\
2\end{bmatrix}
-> \begin{bmatrix}
2\\
6\\
2\end{bmatrix}
-> \begin{bmatrix}
2\\
6\\
-10\end{bmatrix}
$$

这样，我们就能从最后一行倒推出所有的(x, y, z)从而得到方程组的解。现在的问题是，如何找到$A''$?在[线性方程的几何表示](/blog/2026/09/15/AI/linear_algebra/the_geometry_of_linear_equations/)中，我们将结果一个矩阵乘以一个向量，得到的是一个向量：$AX=B$, 其中我们讲到的是column表示法就是将向量X中的x乘以A中的第一列，加上向量X中的y乘以A中的第二列，再加上向量中的z乘以矩阵A中的第三列（我们假设矩阵是一个3x3的矩阵，向量是一个三维向量）。除了列表示法外，行表示法也有这样的操作：$XA = B$中，X是一个行向量$\begin{bmatrix} x& y& z\end{bmatrix}$, A是一个3x3的矩阵，此时计算得到的B也是一个行向量，即x乘以A的第一行，加上y乘以A的第二行，加上z乘以A的第三行。

所以， 从$A$到$A''$到计算中，我们可以理解为是找一个行向量，使得$A$到第二行能把x消掉，然后保持第一行和第三行不变，因此我们可以有一个操作：$XA=A'$，根据行向量乘以矩阵的算法，我们可以得到：第一行不变，因此第一个行向量是$X_0 = \begin{bmatrix} 1& 0& 0\end{bmatrix}$，然后第三行不变，可以得第三个行向量是$X_2=\begin{bmatrix} 0& 0& 1\end{bmatrix}$, 然后第二个行向量我们要的是第一行乘以-3 加上第二行，所以第二个行向量是$X_1 = \begin{bmatrix} -3& 1& 0\end{bmatrix}$, 即：

$$
\begin{bmatrix} 
1& 0& 0\\
-3& 1& 0\\
0& 0& 1
\end{bmatrix}
\begin{bmatrix}
1& 2& 1\\
3& 8& 1\\
0& 4& 1\end{bmatrix}
=
\begin{bmatrix}
1& 2& 1\\
0& 2& -2\\
0& 4& 1\end{bmatrix}
$$

我们把左边的矩阵标注为$E_1$:

$$
E_1 = \begin{bmatrix}
1& 0& 0\\
-3& 1& 0\\
0& 0& 1\end{bmatrix}
$$








