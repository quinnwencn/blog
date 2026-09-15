---
title: 线性方程的几何表示
date: 2026-09-15 15:35:38
tags:
  - linear algebra
  - math
categories:
  - "AI Infra"
---

# 线性方程的几何表示

## 一元一次方程

一元一次方程的几何解释就是一个值，如 $4x=40$ ，它的表示就是$x=5$这个值。

## 二元一次方程

二元一次方程的几何表示是一个二维象限中的一个点，如：

$$
2x - y = 0 \\
-x + 2y = 3
$$

这组方程组在线性代数中，可以用矩阵乘法来表示，如下：

$$
\begin{bmatrix}
2 & -1 \\
-1 & 2
\end{bmatrix}
\begin{bmatrix}
x \\
y
\end{bmatrix}
=
\begin{bmatrix}
0 \\
3
\end{bmatrix}
$$

如果我们用$A$ 替代左边的二维矩阵，$X$替代未知数矩阵，$B$来表示结果，那么最终可以用下式表示，类似于一元一次方程，但是实际上是一个矩阵乘法：

$$
A * X = B
$$

### Row Picture

矩阵存在行(row)和(column)的概念，因此在几何上，可以用row picture和column picture来表示这样的二元一次方程，二元一次方程的row picture表示的就是在二维座标系中两条线的相交点：

![二元一次方程组的行图像](the_geometry_of_linear_equations/raw_picture_of_two_unknown.png)

### Column Picture

用column picture来表达的话，我们先看数学表达式，实际上就是x乘以列1， 加上y 乘以列2:

$$
x
\begin{bmatrix}
2 \\
-1
\end{bmatrix}
+
y
\begin{bmatrix}
-1 \\
2
\end{bmatrix}
=
\begin{bmatrix}
0 \\
3
\end{bmatrix}
$$

这样它的求解就是多少个$ \begin{bmatrix}2 \\\ -1\end{bmatrix}$ 加上多少个$\begin{bmatrix} -1 \\ 2 \end{bmatrix}$ 等于$\begin{bmatrix}0 \\ 3\end{bmatrix}$.

在二维坐标系表示就是向量加法：

![二元一次方程组的列向量图](the_geometry_of_linear_equations/column_picture_of_two_unknown.png)

从column picture可以看出，通过选取不同的(x, y)实际上我们的结果可以铺满整个平面。
