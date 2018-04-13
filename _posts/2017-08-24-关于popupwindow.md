---
layout: post
title: 关于PopupWindow
tags: [Android,PopupWiddow]
---
PopupWindow setWindowLayoutMode 方法在Api 23之后deprecated了，统一放到setWidth和setHeight里面了，和LayouParams的width height抽象统一

在之前的版本如果setWindowLayoutMode设置为match或wrap后，会忽略setwidth和setheight设置的值