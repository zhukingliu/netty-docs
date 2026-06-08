# gRPC 实战操作概述

本章节通过完整 Java 项目，手把手带你构建 gRPC 服务。

## 项目总览

| 项目 | 难度 | 调用模式 | 学习目标 |
|------|------|----------|----------|
| 快速入门 | ⭐ | Unary | gRPC 最小可运行项目 |
| 一元 CRUD | ⭐⭐ | Unary | 用户增删改查完整示例 |
| 服务端流式 | ⭐⭐ | Server Streaming | 实时推送、订阅模式 |
| 客户端流式 | ⭐⭐ | Client Streaming | 文件上传、批量处理 |
| 双向流式 | ⭐⭐⭐ | Bidi Streaming | 实时聊天、协作 |
| Spring Boot 集成 | ⭐⭐ | 全模式 | 生产级 Spring Boot 整合 |

## 环境准备

### Maven 依赖

```xml
<properties>
    <grpc.version>1.68.0</grpc.version>
    <protobuf.version>3.25.3</protobuf.version>
</properties>

<dependencies>
    <dependency>
        <groupId>io.grpc</groupId>
        <artifactId>grpc-netty-shaded</artifactId>
        <version>${grpc.version}</version>
    </dependency>
    <dependency>
        <groupId>io.grpc</groupId>
        <artifactId>grpc-protobuf</artifactId>
        <version>${grpc.version}</version>
    </dependency>
    <dependency>
        <groupId>io.grpc</groupId>
        <artifactId>grpc-stub</artifactId>
        <version>${grpc.version}</version>
    </dependency>
</dependencies>
```
