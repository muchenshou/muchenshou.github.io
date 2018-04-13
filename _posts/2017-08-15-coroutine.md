---
layout: post
title: Coroutine
tags: [Coroutine,协程]
---
Coroutine
[http://coolshell.cn/articles/10975.html](http://coolshell.cn/articles/10975.html)
[http://www.cnblogs.com/youxin/p/3624089.html](http://www.cnblogs.com/youxin/p/3624089.html)

[http://blog.csdn.net/wuhenyouyuyouyu/article/details/52709395](http://blog.csdn.net/wuhenyouyuyouyu/article/details/52709395)

这里有个知乎的讨论，也挺好的

认为codedump说的，一语中的。

[协程的好处有哪些？(知乎)](https://www.zhihu.com/question/20511233)

异步回调的方式，使代码进行了割裂，不那么好写，也不容易理解，使用协程就可以进行同步的写法了，生产力得到了释放，代码也变得优雅，迷人。

[Making coroutines fast](https://rethinkdb.com/blog/making-coroutines-fast/)
这篇文章是rethinkdb在切换到协程方案，对性能的优化，里面有个性能对比的图表。哪怕针对协程调度进行优化，但是性能还是有所降低。不过是不是还是继续优化，使性能得到提高呢？毕竟线程的切换消耗是比协程切换大的。


[coroutine and goroutine](https://bg2bkk.github.io/post/coroutine%20and%20goroutine/)这边文章讲了一些概念和通用跨平台实现方法，不涉及汇编,但我感觉如果想获得性能上的提升还是用汇编的方法，直接操作寄存器会好很多