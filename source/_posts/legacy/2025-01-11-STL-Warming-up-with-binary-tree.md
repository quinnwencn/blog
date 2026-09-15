---
title: "[STL] Warming up with binary tree"
date: 2025-01-11 00:00:00
tags:
  - "C/C++"
  - "STL"
  - "SGI"
  - "Binary Tree"
categories:
  - "Systems C++"
---

# Overview
树的一些概念：
* 根节点：树的顶点
* 叶子节点：没有子节点的节点
* 边：两个节点的连线
* 节点的度：叶子节点的数目
* 节点所在的层：从根节点向下，根节点的层为1
* 节点的深度：从根节点到该节点走过的边的数量
* 节点的高度：从该节点到最远叶子节点的边的数量
* 树的高度：从根节点到最远叶子节点的边的数量

二叉树，也就是一个节点最多只有两个子节点的树，根据节点的分布，可以分为完美二叉树（Perfect Binary Tree)，完全二叉树（Complete Binary Tree），满二叉树（Full Binary Tree),  平衡二叉树（Balance Binary Trree)等。
## 完美二叉树（Perfect Binary Tree)
完美二叉树的所有父节点都有两个节点，且最后一层的叶子节点都是满的。也就是所，除了叶子节点的度是0外，其他所有节点的度都是2. 如果树的高度是h，那么节点数目是 $2^{h + 1} - 1$。
![image](https://github.com/user-attachments/assets/04b640a2-19f5-407f-bbb3-8c5900349807)

## 完全二叉树 (Complete Binary Tree)
完全二叉树只有最后一层的叶子节点没满，也就是说上一层有叶子节点，但是上一层的叶子节点都是成对出现，完美二叉树应该是完全二叉树的一种。
![image](https://github.com/user-attachments/assets/bbaa48dd-2145-4bf2-bf9a-f12054458657)

## 满二叉树
满二叉树的所有父节点都有两个子节点，注意，完全二叉树不一定是是满二叉树，但是完美二叉树也是满二叉树的一种。
![image](https://github.com/user-attachments/assets/be0dd78f-b121-4263-901e-96034d5e68c3)


## 平衡二叉树
平衡二叉树的平衡指的是子树的高度，即任一左子树和右子树的高度差不超过1. 完美二叉树和完全二叉树都是平衡二叉树。
![image](https://github.com/user-attachments/assets/724b16ca-a32b-4ef4-946a-297a40deeedb)

## 二叉搜索树  (Binary Search Tree)
如果节点都有值，且左节点的值都比根节点要小，根节点又都小于右节点，所有的子树也都满足这样的特点，那么这样的树就叫二叉搜索树。给定一个值，我们可以在Lg(N)的时间内判断这个值在不在这棵树。
![image](https://github.com/user-attachments/assets/d4c44ff8-926b-4795-a1f6-3b32469682a2)

### 二叉树的查找
由于二叉树的左子树都小于根节点，右子树都大于根节点，因此查找非常简单，伪代码如下：
```Cpp
Node* find(Node* root, int val) {
    if (root == nullptr) {
        return nullptr;
    }
    
    auto cur = root;
    if (cur->val == val) {
        return cur;
    } else if (cur->val > val) {
        return find(cur->left, val);
    } else {
        return find(cur->right, val);
    }
    return nullptr;
}
```

### 二叉搜索树的插入
二叉树的插入非常简单，由于节点已经是有序的，从根节点开始，只要值比当前节点大，就递归向右子树插入；值比当前节点小就往左子树插入即可：
![image](https://github.com/user-attachments/assets/e836c8b9-ff8d-4567-9916-d5448830d696)

伪代码：
```Cpp
void insert(Node* root, int val) {
    if (root == nullptr) {
      root = new Node(val);
      return root;
    }

    Node* cur = root;
    if (val > ccur-> val) {
        root->right = insert(root->right, val);
   } else {
       root->left = insert(root->left, val);
   }
   return root;
}
```
### 二叉搜索树的删除
二叉搜索树的删除比插入麻烦一点：
* 如果删除节点只有一个子节点（没有子节点也可以当作有一个子节点，该子节点是null），直接将子节点替换到删除的节点即可；
* 删除的节点有不止一个子节点，可能还有一棵子树，那么就将子树的最小的节点替换为删除节点

![image](https://github.com/user-attachments/assets/90819858-ab73-4592-88ba-d9b756f09e75)

伪代码：
```Cpp
void delete(Node* root, int val) {
       if (root == nullptr) {
           return nullptr;
       }

       if (root->val < val) {
           root->right = delete(root->right, val);
      } else if (root->val > val) {
           root->left = delete(root->left, val);
      } else {
           if (root->left == nullptr && root->right == nullptr) {
               delete root;
               return nullptr;
            } else if (root->left == nullptr) {
                  auto temp = root->right;
                  delete root;
                  return temp;
             } else if (root->right == nullptr) {
                  auto temp = root->left;
                  delete root;
                  return temp;
             } else {
                auto min = findMin(root->right);
                root->val = min->val;
                right->right = delete(root->right, min->val);
             }
     }
```
二叉树可以退化成一个数组，比如根节点的值最大，然后一次变小到左节点，最后就是一个数组：
![image](https://github.com/user-attachments/assets/a25f5847-4402-4c9b-ae4d-180e02c5df09)

## 平衡搜索二叉树
由于二叉搜索树可能出现退化，最终导致成为一个数组。参考平衡二叉树，如果能实现一种任何左右子树的深度差别不大的树，就可以很好的维持二叉搜索树的特点，不至于退化。平衡二叉搜索树现在常见的有：AVL-tree, RB-tree, AA-tree等。但是，为了维护平衡，他们的插入和删除操作需要进行一个平衡操作，因此处理时间会慢一点，但整体能维持平衡，因此查询时间会少很多。

### AVL-tree (Adelson-Velskii-Landis tree)
AVL-tree是由 G. M. Adelson-Velsky 和 Evgenii Landis两位前苏联人发明的，因此名字就是他们的名字。AVL-tree的目的是实现查找、插入和删除都能在O(logN)的时间复杂度下完成。为了实现这个目的，AVL-tree增加了左旋、右旋、左右旋以及右左旋等操作，来维持平衡，并定义了平衡因子和平衡条件:
* 平衡因子：每个节点的平衡因子定义为左子树高度减去右子树
* 平衡条件：AVL树的每个节点的平衡因子只能是-1， 0或者1.如果有平衡因子超过了这个范围，就需要通过旋转操作重新平衡。

![image](https://github.com/user-attachments/assets/31686f1f-7b9c-428b-a81f-84d95c19a632)

上图就是一个AVL-tree的例子，任何节点的值都在-1,0,1之间。但是，假如此刻需要插入1，那么这棵树的平衡性就被破坏了：
![image](https://github.com/user-attachments/assets/d24ba3fc-6dc5-4086-8bba-929dc47a8c62)

#### 旋转操作
从上面的两张图可以看出，因为插入的节点导致AVL-tree的平衡性被破坏了，AVL的重平衡是通过旋转操作使得树重新满足AVL-tree的平衡性的，旋转操作有：左旋转、右旋转、左右旋转以及右左旋转。选择哪一个旋转操作和节点的插入位置息息相关。

#### 右旋
当插入节点在左子树的左节点时，左子树比右子树高，此时使用右旋平衡AVL树，因为此时的节点因子是2，且左子树的平衡因子是+1或者0。旋转步骤：
1. 将当前节点的左子节点提升为新的根节点
2. 将新根节点的右子树挂到原根节点的左子树上
3. 将原根节点挂到新根节点的右子树上

```
    A (平衡因子 +2)
   /
  B (平衡因子 +1)
 / \
C   D

右旋后：

  B
 / \
C   A
    /
   D
```

伪代码：
```Cpp
Node* leftRotate(Node* root) {
      Node* new_root = root->left;
      root->left = new_root->right;
      new_root->right = root;
      root = new_root;
      return root;
}
```

#### 左旋
如果插入的节点在右子树的右节点，此时根节点的平衡因子是-2，那么需要通过左旋来重新平衡AVL树，具体的操作是：
1. 将当前节点的右子节点提升为新的根节点
2. 将新根节点的左子树挂到原根节点的右子树
3. 将原根节点挂到新根节点啊的左子树

示例：
```
A (平衡因子 -2)
 \
  B (平衡因子 -1)
 / \
D    C

左旋后：

  B
 / \
A   C
 \
  D
```
伪代码：
```Cpp
Node* rightRotate(Node* root) {
    Node* new_root = root->right;
    root->right = new_root->left;
    new_root->left = root;
    root = new_root;
    return root;
}
```
#### 左右旋
如果插入的是左子树的右节点，就会造成左子树的右子树过高的问题，此时需要先左旋再右旋:
1. 先对当前节点的左节点进行左旋
2. 对当前节点进行右旋
参考示例：
```
    A (平衡因子 +2)
   /
  B (平衡因子 -1)
   \
    C

左旋（对 B）：

    A
   /
  C
 /
B

右旋（对 A）：

  C
 / \
B   A
```
伪代码：
```Cpp
Node* leftRightRotate(Node* root) {
    root->left = leftRotate(root->left);
    return rightRotate(root);
}
```

#### 右左旋
当插入节点位于右子树的左节点时，会导致右子树的左子树过高，此时需要进行右左旋：
1. 对当前节点的右子节点进行右旋
2. 对当前节点进行左旋

示例：
```
A (平衡因子 -2)
 \
  B (平衡因子 +1)
 /
C

右旋（对 B）：

A
 \
  C
   \
    B

左旋（对 A）：

  C
 / \
A   B
```
伪代码：
```Cpp
Node* rightLeftRotate(Node* root) {
    root->right = rightRotate(root->right);
    return leftRotate(root);
}
```
> [!NOTE]
> 上述几个旋转代码都没有更新高度，AVL树应该增加一个成员记录节点的高度。

#### AVL-tree code
```Cpp
#include <iostream>
#include <algorithm>  // for max()

using namespace std;

struct AVLNode {
    int key;           // 节点存储的值
    AVLNode* left;     // 左子节点
    AVLNode* right;    // 右子节点
    int height;        // 节点的高度

    AVLNode(int k) : key(k), left(nullptr), right(nullptr), height(1) {}
};

int height(AVLNode* node) {
    if (node == nullptr)
        return 0;
    return node->height;
}

int getBalance(AVLNode* node) {
    if (node == nullptr)
        return 0;
    return height(node->left) - height(node->right);
}

void updateHeight(AVLNode* node) {
    if (node == nullptr)
        return;
    node->height = 1 + max(height(node->left), height(node->right));
}

AVLNode* rightRotate(AVLNode* y) {
    AVLNode* x = y->left;
    AVLNode* T2 = x->right;

    // 执行旋转
    x->right = y;
    y->left = T2;

    // 更新高度
    updateHeight(y);
    updateHeight(x);

    return x;
}

AVLNode* leftRotate(AVLNode* x) {
    AVLNode* y = x->right;
    AVLNode* T2 = y->left;

    // 执行旋转
    y->left = x;
    x->right = T2;

    // 更新高度
    updateHeight(x);
    updateHeight(y);

    return y;
}

AVLNode* leftRightRotate(AVLNode* z) {
    z->left = leftRotate(z->left);
    return rightRotate(z);
}

AVLNode* rightLeftRotate(AVLNode* z) {
    z->right = rightRotate(z->right);
    return leftRotate(z);
}

AVLNode* insert(AVLNode* node, int key) {
    // 1. 执行标准 BST 插入
    if (node == nullptr)
        return new AVLNode(key);

    if (key < node->key)
        node->left = insert(node->left, key);
    else if (key > node->key)
        node->right = insert(node->right, key);
    else
        return node;  // 不允许重复键

    // 2. 更新节点高度
    updateHeight(node);

    // 3. 获取平衡因子
    int balance = getBalance(node);

    // 4. 根据平衡因子进行旋转
    // 左子树高（右旋或左右旋）
    if (balance > 1) {
        if (key < node->left->key)  // 左子树的左子树高
            return rightRotate(node);
        else  // 左子树的右子树高
            return leftRightRotate(node);
    }
    // 右子树高（左旋或右左旋）
    if (balance < -1) {
        if (key > node->right->key)  // 右子树的右子树高
            return leftRotate(node);
        else  // 右子树的左子树高
            return rightLeftRotate(node);
    }

    // 返回未修改的节点
    return node;
}

AVLNode* deleteNode(AVLNode* root, int key) {
    // 1. 执行标准 BST 删除
    if (root == nullptr)
        return root;

    if (key < root->key)
        root->left = deleteNode(root->left, key);
    else if (key > root->key)
        root->right = deleteNode(root->right, key);
    else {
        // 找到要删除的节点
        if (root->left == nullptr || root->right == nullptr) {
            AVLNode* temp = root->left ? root->left : root->right;
            if (temp == nullptr) {
                temp = root;
                root = nullptr;
            } else {
                *root = *temp;  // 用子节点覆盖当前节点
            }
            delete temp;
        } else {
            // 找到右子树的最小节点
            AVLNode* temp = root->right;
            while (temp->left != nullptr)
                temp = temp->left;

            // 用最小节点的值替换当前节点
            root->key = temp->key;

            // 删除右子树的最小节点
            root->right = deleteNode(root->right, temp->key);
        }
    }

    // 如果树为空，直接返回
    if (root == nullptr)
        return root;

    // 2. 更新节点高度
    updateHeight(root);

    // 3. 获取平衡因子
    int balance = getBalance(root);

    // 4. 根据平衡因子进行旋转
    // 左子树高（右旋或左右旋）
    if (balance > 1) {
        if (getBalance(root->left) >= 0)  // 左子树的左子树高
            return rightRotate(root);
        else  // 左子树的右子树高
            return leftRightRotate(root);
    }
    // 右子树高（左旋或右左旋）
    if (balance < -1) {
        if (getBalance(root->right) <= 0)  // 右子树的右子树高
            return leftRotate(root);
        else  // 右子树的左子树高
            return rightLeftRotate(root);
    }

    return root;
}
```

### RB(Red-Black)-Tree
红黑树也是一种平衡二叉树，也是为了解决二叉搜索树因数据更新可能导致的复杂度退化的问题。红黑树的高度近似为log2N，因此它是近似平衡，插入、查找和删除的时间复杂度也是O(logN)。
红黑树有一些特点：
1. 每个节点只能是红色或者黑色
2. 根节点和叶子节点必须是黑色
3. 红色节点的叶子节点必须是黑色（不能有两个红色节点连在一起）
4. 从任一节点到其每个叶子节点的所有路径包含的黑色节点数目相等（成为黑高，Black-Height）

由于规则3和规则4，我们能确保从根节点到叶子节点的最短路径和最长路径不会太大，最长路径不会超过最短路径的 两倍，因为红色节点不能连续，最长路径就是红黑交替，最短路径是全黑节点。
![rb-tree drawio](https://github.com/user-attachments/assets/2ea1b3bd-4b0e-46ae-97bf-279419b655f0)

#### 可能破坏红黑树的操作：
1. 插入节点：红黑树要求，插入节点时，按照二叉搜索树的规则插入节点，并且将插入的节点颜色标注为红色。根据上图，如果插入的是3，此时左子树的路径的黑色节点数目比右子树多，需要调整；如果插入的是26，那么就会造成有两个红色节点相邻，违反红黑树的特点；
2. 删除节点：删除节点时也是先按照二叉搜索树的方式删除节点。如果删除的是红色节点，此时不会影响红黑树的规律；但是如果删除的是黑色节点，可能会造成两个红色节点相邻，此时需要重平衡红黑树。
重平衡红黑树的方式主要有旋转和重新着色。

#### 旋转
红黑树的旋转氛围左旋转和右旋转，分别和AVL树的左旋转与右旋转一样，这里不做赘述。

#### 重新着色
重新着色就是将红色变为黑色，或者将黑色变为红色。详细的步骤需要分为插入和删除详细介绍。

#### 插入节点
1. 插入节点位于树的根节点（也就是说一开始树是空的），将红色着色成黑色即可：
![image](https://github.com/user-attachments/assets/215e2acd-d30f-4ebd-9c5a-3dc8f48a9b6d)

2. 插入节点N的父节点P是黑色，不需要修复，红黑树仍然稳定
![image](https://github.com/user-attachments/assets/dc6928cf-97cd-425c-b0f1-10a8b3e087b2)

3. 插入节点N的父节点P是红色，此时父节点P和N两个红色节点违反规则3，需要修复：
    * *Case1*： 父节点P的兄弟节点U是红色：
        * 将父节点P和父节点的兄弟节点U改为黑色，祖父节点G改为红色；
        * 将祖父节点G作为新的插入节点，继续修复（因为组父节点的父节点可能是红色的）
![image](https://github.com/user-attachments/assets/8aaa1579-6ec2-4403-a945-d76e2e8e6184)

    * *Case2*：父节点P的兄弟节点U是黑色，且插入节点是父节点的左子节点
        * 将父节点设为黑色，祖父节点设置为红色
        * 对祖父节点进行右旋
![image](https://github.com/user-attachments/assets/0b893f48-0450-4b95-9264-14c1d804df63)

    * *Case 3*：父节点P的兄弟节点U是黑色（只能是空节点，否则违反规则4）， 且插入节点是父节点的右子节点
        * 对父节点进行左旋，然后转换为Case 2
![image](https://github.com/user-attachments/assets/137e77bb-8a03-4288-82fe-e98265ef9068)

一个插入示例：
![image](https://github.com/user-attachments/assets/460d3ea9-73d2-4791-abb4-f9c42741b009 "source: 
![image](https://github.com/user-attachments/assets/db6a591e-3c75-43d3-bf6f-7cf30d431097)
")

#### 删除节点
删除节点时，按照二叉搜索树的方式删除，此时有三个场景：
1. 删除节点没有子节点，这时候可以直接删除
![image](https://github.com/user-attachments/assets/3ec3c9b3-c007-4147-a575-a24577bbe889)

2. 删除节点只有一个子节点，用子节点替换删除节点
![image](https://github.com/user-attachments/assets/a1686233-9a45-4a9f-a5c4-422702a83742)

3. 删除节点有两个子节点，用后继节点（大于删除节点中最小的节点）替换删除节点
![image](https://github.com/user-attachments/assets/684d19e1-a606-4a80-a7b0-9202c33ec5f7)

从上面的场景可以看出，如果在场景2，删除一个有一个子节点的节点，将其子节点替换后，相当于删除的是叶子节点；对于场景3，删除的节点有两个子节点，此时要替换掉的是值为16的节点，也相当于转化为场景2，删除有一个子节点的情况。
这里，我们将删除的节点称为D，替换的节点称为R，回到红黑树的场景，就有几个可能出现的情况：
* 场景1：替换节点是红色**
由于替换的节点是红色，因此把它换到删除节点后，将其颜色改成被删除节点的颜色即可，不会导致不平衡。
![Image](https://github.com/user-attachments/assets/b6802ac2-a929-4195-8a5c-54ba3fa8e493)

* 场景2：替换节点是黑色
替换的节点是黑色时，就必须要进行重平衡处理，这时候可以通过区分替换节点是它的父节点的左子节点还是右子节点，来进行不同的旋转，来达到使树重新平衡。

    * 场景2.1：替换节点是左子节点
       这时候，根据替换节点的兄弟节点S是红色还是黑色，又有两种场景
        * 场景2.1.1：替换节点R的兄弟节点S是红色
          如果兄弟节点是红色，根据红黑树的性质，父节点和子节点必须是黑色，那么就要按照下面步骤处理：
           1. 将兄弟节点着色成黑色
           2. 将父节点着色为红色
           3. 对父节点进行左旋，得到场景 2.1.2.3
           4. 进行场景 2.1.2.3处理
![Image](https://github.com/user-attachments/assets/6285e223-b728-4341-8aa4-ae7636a6e4eb "source: https://blog.fiteen.top/2020/red-black-tree")

         * 场景2.1.2：替换节点R的兄弟节点S是黑色
            如果替换节点R的兄弟节点S是黑色，它的父节点和子节点的颜色就无从得知了，因此这个情况下就需要考虑多种情况：
             * 场景2.1.2.1：替换节点R的兄弟节点S的右子节点SR是红色，左子节点是任意颜色
                即将删除的左子树的一个黑色节点，会导致左子树的黑的色节点少1，右子节点由于是红色的，可以拿过来补充黑色节点，使得平衡依旧，操作是：
                 1. 将兄弟节点的颜色变为父节点的颜色
                 2. 将父节点的颜色变为黑色
                 3. 将兄弟节点的右子节点变成黑色
                 4. 对父节点进行左旋
![image](https://github.com/user-attachments/assets/98630a71-254d-455e-90c6-54b88c6cba36)

              * 场景2.1.2.2：替换节点的兄弟节点的右子节点是黑色，左子节点是红色
              可以向兄弟节点的左子节点接一个节点，补充替换节点被替换掉后的不平衡：
                  1. 将兄弟节点变为红色，
                  2. 将兄弟节点的左子节点变为黑色
                  3. 对兄弟节点进行右旋，得到2.1.2.1
                  4. 按照2.1.2.1处理

              * 场景2.1.2.3： 替换节点的兄弟节点的子节点都是黑色
兄弟节点的子节点都是黑色时，没办法借了，此时只能从父节点入手。如果父节点是黑色的，为了让父节点所在子树保持平衡，先将兄弟节点变为红色，再让父节点称为新的替换节点：
                  * 父节点是黑色
                       1. 将兄弟节点变为红色
                       2. 将父节点作为新的替换节点
                       3. 重新执行删除操作
                  * 父节点是红色
                       1. 替换节点的父节点和替换节点的兄弟节点颜色互换
                       2. 删除节点和替换节点的值交换后，删除替换节点
![image](https://github.com/user-attachments/assets/9a79255a-bf1d-4622-8c1d-9df87d67a8a3)

                        
# Reference
https://blog.fiteen.top/2020/red-black-tree

[source issue](https://github.com/quinnwencn/blog/issues/96)
