# Kafka 实战操作概述

本章节通过实际项目，带你从环境搭建到生产级应用开发。

## 项目总览

| 项目 | 难度 | 知识点 | 学习目标 |
|------|------|--------|----------|
| 快速入门 | ⭐ | Docker 部署、CLI 操作 | Kafka 最小可运行环境 |
| Spring Boot 生产者 | ⭐⭐ | Spring Kafka 集成 | Java 发送消息最佳实践 |
| Spring Boot 消费者 | ⭐⭐ | 消费模型、错误处理 | Java 消费消息最佳实践 |
| 消息可靠性保障 | ⭐⭐⭐ | 不丢不重 | 生产级可靠性方案 |
| 性能调优 | ⭐⭐⭐ | OS/JVM/Broker 调优 | 百万吞吐调优 |

## 环境准备

### Docker 部署 (推荐)

```bash
# docker-compose.yml
version: '3'
services:
  kafka:
    image: confluentinc/cp-kafka:7.6.0
    ports:
      - "9092:9092"
    environment:
      KAFKA_NODE_ID: 1
      KAFKA_LISTENER_SECURITY_PROTOCOL_MAP: 'CONTROLLER:PLAINTEXT,PLAINTEXT:PLAINTEXT'
      KAFKA_LISTENERS: 'PLAINTEXT://:9092,CONTROLLER://:9093'
      KAFKA_ADVERTISED_LISTENERS: 'PLAINTEXT://localhost:9092'
      KAFKA_CONTROLLER_QUORUM_VOTERS: '1@kafka:9093'
      KAFKA_PROCESS_ROLES: 'broker,controller'
      KAFKA_CONTROLLER_LISTENER_NAMES: 'CONTROLLER'
```

### Maven 依赖

```xml
<dependency>
    <groupId>org.springframework.kafka</groupId>
    <artifactId>spring-kafka</artifactId>
</dependency>
```

::: tip
本书使用 **Kafka 3.6+ (KRaft 模式)**，无需 ZooKeeper，更简洁。
:::
