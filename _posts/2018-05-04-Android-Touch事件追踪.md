---
layout: post
title: Android Touch事件追踪
tags: [Android Touch]
---
当我们的手指在屏幕上滑动形成原始数据，经过驱动的处理，再经过系统服务的选择，最终来到我们写的应用。

Touch事件的前世今生还是比较复杂的，涉及到多方代码。

这里我们只关注应用层中java的代码。

ViewRootImpl.setView这个方法是核心。

    InputChannel --> WindowInputEventReceiver   --> InputStage(So many child class, 传递到View是在ViewPostImeInputStage)-->  View.dispatchPointerEvent --> DecorView.dipatchTouchEvent(每个Activity和Dialog的window的直接View是DecorView) --> call Activity.dispatchTouchEvent --> call DecorView.superDispatchTouchEvent (前面这两步像扔飞去来一样，又回到自己怀里了) --> ViewGroup.dispatchTouchEvent


到最后一步我们就熟悉了，dispatchTouchEvent onInterceptTouchEvent onTouchEvent。

我们可以将View在脑海中分成一层层的，父View为一层，子View为下层，这样子整个视图，自上到下，可以形象一点。

用语言简单叙述一下每一层逻辑就是
```lua
if onInterceptTouchEvent then
    self.onTouchEvent
else
    childViews.dispatchTouchEvent
end
 ```

 当然实际要比这复杂的多。

 每一层View都要经过这个逻辑，touch事件的传递会呈现一个 V 字形。

 这里有几种情况。

- onInterceptTouch在DOWN事件的时候就为false,之后在这层View就不会判断onInterceptTouch了，直接调用onTouchEvent
- onInterceptTouch在DOWN事件的时候为true，但是在MOVE的时候被intercept了,会给原先传递事件的子View传递一个CANCEL事件,之后的MOVE，UP事件就直接onTouchEvent了，可以理解成 大V 变 小v 了
- 还有就是如果子View的onTouchEvent的处理中调用了requestDisallowInterceptTouchEvent(true)的话，在MOVE事件的传递过程中，是不会判断onInterceptTouch方法的，也就是不能被拦截了，接下来MOVE事件一直都会发给子View


还有要记录的一点是mFirstTouchTarget,这个变量会再DOWN事件时，如果子View接受了事件mFirstTouchTarget会记住处理的View，mFirstTouchTarget相当于一个单向不循环链表,至于为什么是个链表，是因为多指触摸到多个View的情况