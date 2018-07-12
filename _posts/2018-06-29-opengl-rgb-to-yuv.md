---
layout: post
title: Android GPU rgb2yuv
tags: [Android opengl rgb yuv]
---
# Android GPU rgb2yuv

最近做的录屏项目在surface上渲染，软编码需要自己从gpu读取数据，但是读取的是rgb格式，需要转码yuv，然后再编码，读取需要pbo的异步读取（将在另外一篇文章记述），印象中rbg转yuv应该可以放到gpu中计算的，但是苦于自己gl不太熟悉，虽然隐隐觉得是种可实施手段，但是不知道如何做。下面是几经辗转搜索到的。原文已经删除掉了，在百度快照中找到的，🙄

代码在git工程yuvoutfilter.java中，这个代码有个问题，可能会出现转后yuv，显示出来花屏，问题是frament gl 脚本中，计算比例是以图片高度计算的，不是以像素个数计算的，如果不能整除，有些临界点的像素会覆盖，导致花屏

Android OpenGLES2.0 直接导出YUV420数据
2017年09月24日 19:54:55
阅读数：2062
Android OpenGLES2.0中提供的glReadPixels方法提供的格式只有RGB的几种格式，但是这并不妨碍我们导出YUV格式的数据，因为不管是RGBA还是YUV，都不是glReadPixels方法关心的，它关心的其实是每个色彩分量占多少位。可以看到glReadPixels提供的导出格式有RGBA、RGB等，却不会在提供了RGBA的导出格式后又提供ABGR、ARGB这样的导出格式，就是这个道理了。

获取YUV420的方案
如果我们要做的工作只是处理视频图像，然后再编码，我们无需这一步，可以直接利用MediaCodec+Surface编码，效率比导出YUV来编码更高，可以参考我的上一篇博客Android利用硬解硬编和OpenGLES来高效的处理MP4视频。但是我们需要对图像进行处理，然后传输的时候，就要考虑导出YUV数据了。利用OpenGLES2.0 处理完图像后，获取YUV数据的方案大致分为以下几种：

glReadPixels 获取RGB的数据，然后利用libyuv获取其他方式将RGB转换成YUV420
渲染三次，将图像分别渲染为Y平面，U平面，V平面，每次渲染后就glReadPixels得到YUV420
将图像渲染成YUV444导出，然后利用CPU将YUV444转换成YUV420
将图像渲染成YUV420导出
（注：异步读取的问题暂时先不讨论）

方案1可以算是“传统”方法，毕竟RGB是GLES2.0字面上就支持的格式，它需要读取的数据大小是width**height**3，而且还有一步CPU中RGB转YUV的处理过程。速度真是不敢恭维，利用几款手机测试，368*640大小的图像，GPU处理&glReadPixels(注：glReadPixels会等待GPU处理当前图像完成)读取时间大概为16-24ms，转换5-12ms。 
方案2方案3，我还没有试过，不过我心里对这两个方案是比较抵触的，如果方案4确实行不通，我不介意选择方案3，方案2渲染3次，readPixels3次不得不说是一个比较糟糕的方案。

方案4数据大小为width**height**3/2，而且也不需要CPU处理，实现之前唯一的担心就是GPU中处理起来太麻烦，会耗时比较长。最后用几款手机及测试，368*640大小的图像，GPU处理&glReadPixels时间为12-20ms。这个时间还是比较可观的。

导出算法
之前有在CPU中实现过RGBA转YUV，GPU中转换也差不多了，主要的问题还是怎么将YUV直接导出来。了解了YUV和RGBA的格式，可以知道YUV是Y平面大小为width**height，如果我们最后glReadPixels格式为RGBA，那就占有图像的1/4大小，420P中，U平面大小为width**height/4，占有1/16，V平面大小和U平面一样。而在420SP中，UV同平面交错排列占有1/8。那么实际上我们glReadPixels的宽高就是width,height*3/8。我们在Shader中需要做的就是把YUV填充到对应的位置。

具体片元着色器如下，代码中有详细备注，就不多加分析了。思路就是在Y区域，每个像素点存储四 
个Y。YUV420P格式时，U区域每个像素点存储4个U，V区域每个像素点存储4个V。YUV420SP时，UV在同一个区域交替排列，那么就是每个像素点存储UVUV（NV12）四个值或者VUVU（NV21）四个值。

为了减少计算，采样UV没有用四点平均，直接采样四个点中的左上角的点作为UV计算的输入值。

precision highp float;
precision highp int;

varying vec2 vTextureCo;
uniform sampler2D uTexture;

为了简化计算，宽高都必须为8的倍数
uniform float uWidth;            纹理宽
uniform float uHeight;           纹理高

转换公式
Y’= 0.299**R’ + 0.587**G’ + 0.114*B’
U’= -0.147**R’ - 0.289**G’ + 0.436**B’ = 0.492**(B’- Y’)
V’= 0.615**R’ - 0.515**G’ - 0.100**B’ = 0.877**(R’- Y’)
导出原理：采样坐标只作为确定输出位置使用，通过输出纹理计算实际采样位置，进行采样和并转换,
然后将转换的结果填充到输出位置

float cY(float x,float y){
    vec4 c=texture2D(uTexture,vec2(x,y));
    return c.r**0.2990+c.g**0.5870+c.b*0.1140;
}

float cU(float x,float y){
    vec4 c=texture2D(uTexture,vec2(x,y));
    return -0.1471**c.r - 0.2889**c.g + 0.4360*c.b+0.5000;
}

float cV(float x,float y){
    vec4 c=texture2D(uTexture,vec2(x,y));
    return 0.6150**c.r - 0.5150**c.g - 0.1000*c.b+0.5000;
}

vec2 cPos(float t,float shiftx,float shifty){
    vec2 pos=vec2(uWidth**vTextureCo.x,uHeight**(vTextureCo-shifty));
    return vec2(mod(pos.x**shiftx,uWidth),(pos.y**shiftx+floor(pos.x**shiftx/uWidth))**t);
}

Y分量的计算
vec4 calculateY(){
    填充点对应图片的位置
    float posX=floor(uWidth*vTextureCo.x);
    float posY=floor(uHeight*vTextureCo.y);
    实际采样起始点对应图片的位置
    float rPosX=mod(posX*4.,uWidth);
    float rPosY=posY**4.+floor(posX**4./uWidth);
    vec4 oColor=vec4(0);
    float textureYPos=rPosY/uHeight;
    oColor[0]=cY(rPosX/uWidth,textureYPos);
    oColor[1]=cY((rPosX+1.)/uWidth,textureYPos);
    oColor[2]=cY((rPosX+2.)/uWidth,textureYPos);
    oColor[3]=cY((rPosX+3.)/uWidth,textureYPos);
    return oColor;
}


U分量的计算
vec4 calculateU(){
    U的采样，宽度是1:8，高度是1:2，U的位置高度偏移了1/4，一个点是4个U，采样区域是宽高位8*2
    float posX=floor(uWidth*vTextureCo.x);
    float posY=floor(uHeight*(vTextureCo.y-0.2500));
    实际采样起始点对应图片的位置
    float rPosX=mod(posX*8.,uWidth);
    float rPosY=posY**16.+floor(posX**8./uWidth)*2.;

    vec4 oColor=vec4(0);
    oColor[0]= cU(rPosX_uWidth,rPosY_uHeight);
    oColor[1]= cU((rPosX+2.)_uWidth,rPosY_uHeight);
    oColor[2]= cU((rPosX+4.)_uWidth,rPosY_uHeight);
    oColor[3]= cU((rPosX+6.)_uWidth,rPosY_uHeight);
    return oColor;
}

V分量计算
vec4 calculateV(){
    V的采样，宽度是1:8，高度是1:2，U的位置高度偏移了1/4，一个点是4个V，采样区域是宽高位8*2
    float posX=floor(uWidth*vTextureCo.x);
    float posY=floor(uHeight*(vTextureCo.y-0.3125));
    实际采样起始点对应图片的位置
    float rPosX=mod(posX*8.,uWidth);
    float rPosY=posY**16.+floor(posX**8./uWidth)*2.;

    vec4 oColor=vec4(0);
    oColor[0]=cV(rPosX_uWidth,rPosY_uHeight);
    oColor[1]=cV((rPosX+2.)_uWidth,rPosY_uHeight);
    oColor[2]=cV((rPosX+4.)_uWidth,rPosY_uHeight);
    oColor[3]=cV((rPosX+6.)_uWidth,rPosY_uHeight);
    return oColor;
}

UV的计算，YUV420SP用，test
vec4 calculateUV(){
    float posX=floor(uWidth*vTextureCo.x);
    float posY=floor(uHeight*(vTextureCo.y-0.2500));
    实际采样起始点对应图片的位置
    float rPosX=mod(posX*4.,uWidth);
    float rPosY=posY**8.+floor(posX**4./uWidth)*2.;
    vec4 oColor=vec4(0);
    oColor[0]= cU((rPosX+1.)_uWidth,(rPosY+1.)_uHeight);
    oColor[1]= cV((rPosX+1.)_uWidth,(rPosY+1.)_uHeight);
    oColor[2]= cU((rPosX+3.)_uWidth,(rPosY+1.)_uHeight);
    oColor[3]= cV((rPosX+3.)_uWidth,(rPosY+1.)_uHeight);
    return oColor;
}

void main() {
    如果希望导出420SP格式，删除<0.3125的判断，在0.3750判断中换成calculateUV就可以了
    稍微改改可以支持I420,YV12,NV12,NV21四种格式，不建议用传入参数然后if else来实现，GPU中尽可能不用流程控制语句
    if(vTextureCo.y<0.2500){
        gl_FragColor=calculateY();
    }else if(vTextureCo.y<0.3125){
        gl_FragColor=calculateU();
    }else if(vTextureCo.y<0.3750){
        gl_FragColor=calculateV();
    }else{
        gl_FragColor=vec4(0,0,0,0);
    }
}
源码及示例[[GitHub - aiyaapp/AAVT](https://github.com/aiyaapp/AAVT)]
源码及示例在github上，此项目旨在编写一套小巧实用的Android平台音频、视频(图像)的处理框架。有需要的朋友可以自己下载，如有帮助，欢迎start、fork和打赏。本篇博客相关代码为YuvOutputFilter，可以直接链入此框架使用：

创建YUV导出的Filter
mYuvOutput=new YuvOutputFilter(YuvOutputFilter.EXPORT_TYPE_I420);
GL相关初始化，在GL线程中
mYuvFilter.create();
设置导出大小，在GL线程中
mYuvOutput.sizeChanged(width,height);
YUV转换，在GL线程中
mYuvOutput.drawToTexture(texture);
获取YUV数据
mYuvOutput.getOutput(receiveBytes);
欢迎转载，转载请保留文章出处。湖广午王的博客[http://blog.csdn.net/junzia/article/details/78079024]