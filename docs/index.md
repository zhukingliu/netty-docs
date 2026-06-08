---
layout: home

hero:
  name: "后端技术学习指南"
  text: "Netty + Kafka + gRPC + MongoDB"
  tagline: 从入门到精通，全面覆盖 Netty、Kafka、gRPC 与 MongoDB 的基础知识、核心原理与实战操作
  image:
    src: /netty-docs/favicon.svg
    alt: Logo
  actions:
    - theme: brand
      text: Netty 学习
      link: /netty/basics/
    - theme: alt
      text: Kafka 学习
      link: /kafka/basics/
    - theme: alt
      text: gRPC 学习
      link: /grpc/basics/
    - theme: alt
      text: MongoDB 学习
      link: /mongodb/basics/

features:
  - icon: 📡
    title: Netty 网络框架
    details: 从 BIO/NIO/AIO 开始，深入 Reactor 模型、Channel/Pipeline/EventLoop 核心组件，剖析 Bootstrap 启动与内存管理源码，手把手构建 Echo 服务、聊天室、HTTP 服务、WebSocket 和自定义协议。
    link: /netty/basics/

  - icon: 📨
    title: Kafka 消息引擎
    details: 系统学习 Topic/Partition/ConsumerGroup 核心概念，深入日志存储、副本机制、ISR 选举、事务与幂等性原理，实战 Spring Boot 集成、消息可靠性保障与性能调优。
    link: /kafka/basics/

  - icon: 🔗
    title: gRPC 远程调用
    details: 掌握 Protocol Buffers 定义与服务生成，深入 HTTP/2 帧、Channel 连接管理、负载均衡与拦截器原理，实战四种调用模式（一元/服务端流/客户端流/双向流）与 Spring Boot 集成。
    link: /grpc/basics/

  - icon: 🍃
    title: MongoDB 文档数据库
    details: 理解 NoSQL 与文档模型的优势，深入 WiredTiger 存储引擎、副本集选举、分片集群与事务原理，实战 Spring Data MongoDB、聚合管道、副本集部署与性能优化。
    link: /mongodb/basics/
---
