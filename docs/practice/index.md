# 实战操作概述

本章节通过完整项目案例，手把手带你用 Netty 构建实际的网络应用。

## 项目总览

| 项目 | 难度 | 知识点 | 学习目标 |
|------|------|--------|----------|
| Echo 服务器 | ⭐ | 基础 | Netty 最小可运行项目 |
| 多人群聊系统 | ⭐⭐ | Channel 管理 | ChannelGroup、广播 |
| HTTP 服务器 | ⭐⭐ | HTTP 协议 | HttpServerCodec、路由 |
| WebSocket 聊天 | ⭐⭐⭐ | WebSocket | 长连接、全双工 |
| 自定义协议 | ⭐⭐⭐⭐ | 编解码 | LengthField、序列化 |

## 开发环境准备

### Maven 依赖

```xml
<dependency>
    <groupId>io.netty</groupId>
    <artifactId>netty-all</artifactId>
    <version>4.1.117.Final</version>
</dependency>
```
