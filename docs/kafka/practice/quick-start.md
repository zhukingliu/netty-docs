# Kafka 快速入门

## Docker 启动 Kafka

```bash
# 拉取镜像并启动
docker run -d --name kafka \
  -p 9092:9092 \
  -e KAFKA_NODE_ID=1 \
  -e KAFKA_PROCESS_ROLES=broker,controller \
  -e KAFKA_LISTENERS=PLAINTEXT://:9092,CONTROLLER://:9093 \
  -e KAFKA_ADVERTISED_LISTENERS=PLAINTEXT://localhost:9092 \
  -e KAFKA_CONTROLLER_QUORUM_VOTERS=1@localhost:9093 \
  -e KAFKA_CONTROLLER_LISTENER_NAMES=CONTROLLER \
  confluentinc/cp-kafka:7.6.0
```

## 命令行操作

### Topic 管理

```bash
# 进入容器
docker exec -it kafka bash

# 1. 创建 Topic
kafka-topics --bootstrap-server localhost:9092 \
    --create --topic test-topic \
    --partitions 3 --replication-factor 1

# 2. 查看所有 Topic
kafka-topics --bootstrap-server localhost:9092 --list

# 3. 查看 Topic 详情
kafka-topics --bootstrap-server localhost:9092 \
    --describe --topic test-topic

# 4. 修改分区数（只能增加）
kafka-topics --bootstrap-server localhost:9092 \
    --alter --topic test-topic --partitions 6

# 5. 删除 Topic
kafka-topics --bootstrap-server localhost:9092 \
    --delete --topic test-topic
```

### 生产者操作

```bash
# 控制台生产者 — 发送消息
kafka-console-producer --bootstrap-server localhost:9092 \
    --topic test-topic

# 输入消息（每行一条）:
> hello kafka
> this is a test
> {"orderId": 123, "amount": 99.9}
^C  # Ctrl+C 退出

# 带 Key 的生产者
kafka-console-producer --bootstrap-server localhost:9092 \
    --topic test-topic \
    --property "parse.key=true" \
    --property "key.separator=:"
> order_1:{"orderId":1,"amount":100}
> order_2:{"orderId":2,"amount":200}
```

### 消费者操作

```bash
# 控制台消费者 — 从最新开始消费
kafka-console-consumer --bootstrap-server localhost:9092 \
    --topic test-topic

# 从头开始消费
kafka-console-consumer --bootstrap-server localhost:9092 \
    --topic test-topic --from-beginning

# 显示 Key、分区、Offset
kafka-console-consumer --bootstrap-server localhost:9092 \
    --topic test-topic --from-beginning \
    --property print.key=true \
    --property print.partition=true \
    --property print.offset=true
```

### 消费者组管理

```bash
# 指定消费者组消费
kafka-console-consumer --bootstrap-server localhost:9092 \
    --topic test-topic \
    --group my-group

# 查看所有消费者组
kafka-consumer-groups --bootstrap-server localhost:9092 --list

# 查看消费者组详情
kafka-consumer-groups --bootstrap-server localhost:9092 \
    --describe --group my-group

# 输出示例:
# GROUP     TOPIC       PARTITION  CURRENT-OFFSET  LOG-END-OFFSET  LAG
# my-group  test-topic  0          15              15              0
# my-group  test-topic  1          20              22              2   ← 有 2 条未消费
# my-group  test-topic  2          10              10              0

# 重置 Offset (从头开始消费)
kafka-consumer-groups --bootstrap-server localhost:9092 \
    --group my-group --reset-offsets --to-earliest \
    --topic test-topic --execute
```

## 压测工具

```bash
# 生产者压测
kafka-producer-perf-test \
    --topic test-topic \
    --num-records 1000000 \
    --record-size 1024 \
    --throughput 100000 \
    --producer-props bootstrap.servers=localhost:9092 \
    acks=1 compression.type=lz4

# 输出:
# 1000000 records sent, 100000 records/sec (102.40 MB/sec)
# 平均延迟: 2.5 ms

# 消费者压测
kafka-consumer-perf-test \
    --bootstrap-server localhost:9092 \
    --topic test-topic \
    --messages 1000000
```

## 简单测试流程

```bash
# 终端1: 启动消费者（等待消息）
kafka-console-consumer --bootstrap-server localhost:9092 \
    --topic quickstart-events --from-beginning

# 终端2: 启动生产者（发送消息）
kafka-console-producer --bootstrap-server localhost:9092 \
    --topic quickstart-events
> Hello World
> Kafka Rocks!
```

::: tip
这些命令行工具是调试 Kafka 的瑞士军刀。遇到问题时先用它们排除网络和配置问题。
:::
