# Kafka 副本机制

## 为什么需要副本

单台 Broker 宕机会导致数据不可用。Kafka 通过**多副本**机制保证高可用。

```mermaid
flowchart TD
    subgraph "Topic: orders (3分区, 3副本)"
        subgraph "Partition-0"
            L0[Leader<br/>Broker-1]
            R0[Follower<br/>Broker-2]
            R0b[Follower<br/>Broker-3]
        end
        subgraph "Partition-1"
            L1[Leader<br/>Broker-2]
            R1[Follower<br/>Broker-1]
            R1b[Follower<br/>Broker-3]
        end
    end

    L0 -->|replicate| R0
    L0 -->|replicate| R0b
    L1 -->|replicate| R1
    L1 -->|replicate| R1b
```

## 核心概念

| 概念 | 说明 |
|------|------|
| **Replica** | 一个分区的拷贝，一个分区可以有多个 Replica |
| **Leader Replica** | 负责处理所有读写请求的副本 |
| **Follower Replica** | 被动从 Leader 同步数据的副本 |
| **ISR** | In-Sync Replica，与 Leader 保持同步的副本集合 |
| **AR** | Assigned Replica，该分区分配的所有副本 |
| **OSR** | Out-of-Sync Replica，落后于 Leader 的副本 |

```
AR = ISR + OSR
```

## ISR 机制

```mermaid
flowchart LR
    subgraph "AR (所有副本)"
        subgraph "ISR (同步副本)"
            L[Leader<br/>Broker-1]
            F1[Follower<br/>Broker-2]
        end
        subgraph "OSR (落后副本)"
            F2[Follower<br/>Broker-3]
        end
    end
```

### ISR 伸缩

| 事件 | 操作 |
|------|------|
| Follower 在 `replica.lag.time.max.ms` (30s) 内同步 | 加入 ISR |
| Follower 落后超过 `replica.lag.time.max.ms` | 移出 ISR（进入 OSR） |
| Follower 追上 Leader 后 | 重新加入 ISR |

```bash
# 查看分区 ISR 状态
kafka-topics.sh --bootstrap-server localhost:9092 \
    --describe --topic my-topic

# 输出:
# Topic: my-topic  Partition: 0  Leader: 1  Replicas: 1,2,3  Isr: 1,2,3
```

## HW 与 LEO (水位线)

```mermaid
flowchart TD
    subgraph "Leader Partition"
        L_LEO[LEO = 10]
        L_HW[HW = 8]
    end

    subgraph "Follower Partition"
        F_LEO[LEO = 8]
        F_HW[HW = 8]
    end

    L_LEO -->|"最新 Offset+1"| L_LEO
    L_HW -->|"ISR 中最小的 LEO"| L_HW
```

| 概念 | 全称 | 含义 | 作用 |
|------|------|------|------|
| **LEO** | Log End Offset | 日志末尾下一条消息的 Offset | 标识写入进度 |
| **HW** | High Watermark | ISR 中最小的 LEO | 消费者可见的最高的 Offset |

::: warning 重要
消费者**只能读到 HW 之前的消息**。HW 之后的消息对消费者不可见。
:::

## 数据同步流程

```mermaid
sequenceDiagram
    participant P as Producer
    participant L as Leader
    participant F as Follower
    participant C as Consumer

    P->>L: 1. 写入消息 (Offset=5)
    L->>L: 2. LEO=6
    L-->>P: 3. ACK (如果 acks=1/-1)
    F->>L: 4. Fetch (Offset=5)
    L-->>F: 5. 返回消息
    F->>F: 6. 写入本地, LEO=6
    L->>L: 7. 收到F的LEO=6 → HW=6
    C->>L: 8. Fetch (Offset=5)
    L-->>C: 9. 返回消息 (Offset ≤ HW)
```

## 副本配置建议

| 场景 | 副本数 | ISR 最小 | min.insync.replicas |
|------|--------|----------|---------------------|
| 开发测试 | 1 | 1 | 1 |
| 一般生产 | 3 | 2 | 2 |
| 高可靠 | 3~5 | 2~3 | 2~3 |

```bash
# Broker 级别默认配置
default.replication.factor=3
min.insync.replicas=2

# Topic 级别覆盖
kafka-topics.sh --create \
    --topic critical-orders \
    --replication-factor 3 \
    --config min.insync.replicas=2
```

::: tip 
`replication.factor=N` 意味着可以容忍 **N-1** 个 Broker 宕机。

`min.insync.replicas=2` 配合 `acks=all` 时，至少 2 个 ISR 确认才算写入成功。
:::
