---
layout: post
title: Android Matrix
tags: [Android Matrix]
---
矩阵的乘法满足以下运算律：
* 结合律: A(BC) = A(BC)
* 左分配律： (A+B)C = AC + BC
* 右分配律： C(A+B) = CA + CB
* 矩阵乘法不满足交换律。

最后一条就是matrix前乘和后乘不一样的原因

![Matrix]({{ site.baseurl }}/assets/android_matrix/20160518114250373.png)

前乘-> matrix.preScale(0.5f, 0.5f) 的意思是 

#### &emsp;&emsp;&emsp;&emsp;matrix * [（0.5f, 0.5f）的矩阵]

后乘->matrix.postScale(0.5f, 0.5f) 的意思是 
#### &emsp;&emsp;&emsp;&emsp;[（0.5f, 0.5f）的矩阵] * matrix

如果多个矩阵相乘，后面的偏移等操作都会受到前面操作的影响，原来搞过一次在scale后进行偏移，偏移的值还是以初始矩阵的基础算的，导致显示结果一直不对。

[android matrix 最全方法详解与进阶（完整篇）](https://blog.csdn.net/cquwentao/article/details/51445269)