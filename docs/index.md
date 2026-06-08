---
layout: home

hero:
  name: "后端技术学习指南"
  text: "Netty + Kafka"
  tagline: 从入门到精通，全面覆盖 Netty 与 Kafka 的基础知识、核心原理与实战操作
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
      text: GitHub
      link: https://github.com/zhukingliu/netty-docs

features:
  - icon: 📡
    title: Netty 网络框架
    details: 从 BIO/NIO/AIO 开始，深入 Reactor 模型、Channel/Pipeline/EventLoop 核心组件，剖析 Bootstrap 启动与内存管理源码，手把手构建 Echo 服务、聊天室、HTTP 服务、WebSocket 和自定义协议。
    link: /netty/basics/

  - icon: 📨
    title: Kafka 消息引擎
    details: 系统学习 Topic/Partition/ConsumerGroup 核心概念，深入日志存储、副本机制、ISR 选举、事务与幂等性原理，实战 Spring Boot 集成、消息可靠性保障与性能调优。
    link: /kafka/basics/
---
