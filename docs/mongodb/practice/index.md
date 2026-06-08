# MongoDB 实战操作概述

本章节通过实际项目，从环境搭建到生产级应用开发。

## 项目总览

| 项目 | 难度 | 知识点 | 学习目标 |
|------|------|--------|----------|
| Docker 快速入门 | ⭐ | Docker、Shell、Compass | 5 分钟上手 MongoDB |
| Spring Data MongoDB | ⭐⭐ | Repository、Template、实体映射 | Java 集成最佳实践 |
| 聚合管道实战 | ⭐⭐⭐ | $match/$group/$lookup/$unwind | 数据分析核心技能 |
| 副本集部署 | ⭐⭐⭐ | Docker Compose 部署副本集 | 高可用运维 |
| 性能优化 | ⭐⭐⭐ | 索引调优、慢查询、explain | 生产级性能保障 |

## 环境准备

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-mongodb</artifactId>
</dependency>
```
