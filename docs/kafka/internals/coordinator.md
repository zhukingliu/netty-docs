# Coordinator 协调器

## Coordinator 体系

Kafka 有两类协调器，分别负责不同的协调任务：

| 协调器 | 负责 | 所管理的 |
|--------|------|----------|
| **GroupCoordinator** | 消费者组管理 | ConsumerGroup 的 Rebalance、Offset 管理 |
| **TransactionCoordinator** | 事务管理 | 生产者事务、幂等性 |

## GroupCoordinator

### 位置

```mermaid
flowchart TD
    CG1[ConsumerGroup: order-group] --> P_OFFSET[__consumer_offsets<br/>Partition-7]
    CG2[ConsumerGroup: payment-group] --> P_OFFSET2[__consumer_offsets<br/>Partition-15]

    P_OFFSET --> B1[Broker-2<br/>GroupCoordinator]
    P_OFFSET2 --> B2[Broker-5<br/>GroupCoordinator]
```

- ConsumerGroup 的 Offset 存储在内部 Topic `__consumer_offsets` 的某个分区
- 该分区的 **Leader 所在的 Broker** 就是这个 Group 的 GroupCoordinator

### 职责

```mermaid
flowchart TD
    GC[GroupCoordinator] --> A[管理 Consumer 加入/离开]
    GC --> B[触发 Rebalance]
    GC --> C[接收 Offset 提交]
    GC --> D[管理消费者组元数据]
```

### Rebalance 流程

```mermaid
sequenceDiagram
    participant C1 as Consumer-1
    participant C2 as Consumer-2
    participant GC as GroupCoordinator

    C1->>GC: 1. JoinGroup (想加入 group)
    C2->>GC: 2. JoinGroup
    GC->>GC: 3. 选出 Group Leader (某个 Consumer)
    GC-->>C1: 4. 返回 Leader + 成员列表
    GC-->>C2: 4. 返回 Leader + 成员列表
    C1->>GC: 5. SyncGroup (Leader 上报分配方案)
    GC-->>C1: 6. 分配结果
    GC-->>C2: 6. 分配结果
    C1->>C1: 7. 开始消费
    C2->>C2: 7. 开始消费
```

### Rebalance 触发场景

| 场景 | 说明 |
|------|------|
| Consumer 加入 | 新消费者 join 组 |
| Consumer 离开 | 正常关闭或 crash |
| 心跳超时 | `session.timeout.ms` 内未收到心跳 |
| 消费超时 | `max.poll.interval.ms` 内未 poll |
| Topic 分区变化 | 分区数增加 |

## TransactionCoordinator

### 幂等性 (Idempotent)

幂等性保证单分区内不会有重复消息：

```java
// 启用幂等性
props.put("enable.idempotence", true);  // Kafka 3.0+ 默认开启
// 隐式设置: acks=all, retries=MAX, max.in.flight=5
```

**实现原理**: Producer 初始化时获得 PID (Producer ID)，每条消息携带 `<PID, SequenceNumber>`。Broker 据此去重。

```
同一个 PID 的 SequenceNumber 严格递增:
  msg-1: <PID=1001, Seq=0>
  msg-2: <PID=1001, Seq=1>
  msg-3: <PID=1001, Seq=1>  ← 重复! Broker 丢弃
  msg-4: <PID=1001, Seq=2>
```

### 事务 (Transaction)

事务更进一步，保证**跨分区**的原子写入：

```mermaid
sequenceDiagram
    participant P as Producer
    participant TC as TransactionCoordinator
    participant T as Topic-A + Topic-B

    P->>TC: 1. initTransactions()
    TC-->>P: 2. 分配 TransactionalId → PID

    P->>P: 3. beginTransaction()
    P->>T: 4. 写入 Topic-A (msg-1)
    P->>T: 5. 写入 Topic-B (msg-2)
    P->>TC: 6. commitTransaction()
    
    TC->>T: 7. 写入 Commit Marker
    T->>T: 8. 消息对消费者可见
```

```java
// 事务生产者示例
Properties props = new Properties();
props.put("bootstrap.servers", "localhost:9092");
props.put("transactional.id", "order-tx-1");  // 事务 ID
props.put("enable.idempotence", true);

KafkaProducer<String, String> producer = new KafkaProducer<>(props);
producer.initTransactions();  // 初始化事务

try {
    producer.beginTransaction();
    producer.send(new ProducerRecord<>("topic-A", "msg1"));
    producer.send(new ProducerRecord<>("topic-B", "msg2"));
    producer.commitTransaction();  // 原子提交
} catch (Exception e) {
    producer.abortTransaction();   // 回滚
}
```

### 事务消费

```java
// 隔离级别
props.put("isolation.level", "read_committed");  // 只读已提交消息
// read_uncommitted = 读取所有消息 (默认)
```

::: tip 事务 vs 幂等
| 特性 | 幂等性 | 事务 |
|------|--------|------|
| 作用范围 | 单分区 | 跨分区 |
| 保证 | 无重复 | 原子性 + 无重复 |
| 性能开销 | 极低 | 有开销 |
| 适用场景 | 几乎所有场景 | 金融、订单等严格场景 |
:::
