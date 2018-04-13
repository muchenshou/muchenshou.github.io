---
layout: post
title: shadowsocks-建立vpn服务器
tags: [shadownsocks, vpn]
---
利用shadowsocks建立一个局域网内的vpn server
这里利用了两篇文章

1. [http://blog.csdn.net/u013896064/article/details/52261051](http://blog.csdn.net/u013896064/article/details/52261051)

2. [http://blog.csdn.net/lvshaorong/article/details/52909055](http://blog.csdn.net/lvshaorong/article/details/52909055)

第一篇是讲如何建立pptpd服务的，建立好后可以直接在android，ios的系统自带vpn使用。

第二篇是讲如何建立ss-redir服务,并利用iptables进行nat重定向，将pptpd的流量转入ss-redir服务，中间需要一个shadowsocks的账号
