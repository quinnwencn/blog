矩阵的乘法可以有多种理解：行乘以列、矩阵乘以列，行乘以矩阵，以及列乘以行。

## 行乘列

一个矩阵乘法 $AB = C$，可以理解为$C$的元素来源于$A$的行乘以$B$的列，即：

$$
C_{ik} = (Row_i of A)(Col_k of B)
$$

所以$C_{34} = RowA_3 * ColB_4$，行乘以列的到的就是各个元素的乘积之和，即：

$$
C_{34} = A_{31}*B_{14} + A_{32}*B_{24}... = \sum_1^nA_{3i}B_{i4}
$$

## 矩阵乘以列

在[线性方程的几何表示]([线性方程的几何表示 - Quinn&#39;s Blog](https://quinnwencn.github.io/blog/2026/09/15/AI/linear_algebra/the_geometry_of_linear_equations/))中，我们讨论过一个矩阵乘以列，得到的就是一个列


