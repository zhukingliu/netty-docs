# Spring Boot 集成 Kafka 消费者

## 配置文件

```yaml
spring:
  kafka:
    bootstrap-servers: localhost:9092
    consumer:
      group-id: order-consumer-group
      key-deserializer: org.apache.kafka.common.serialization.StringDeserializer
      value-deserializer: org.springframework.kafka.support.serializer.JsonDeserializer
      
      # Offset 管理
      enable-auto-commit: false       # 手动提交
      auto-offset-reset: earliest     # 从头开始消费
      
      # 性能
      max-poll-records: 500
      fetch-min-size: 1024           # 最少拉取 1KB
      fetch-max-wait: 500            # 最多等 500ms
      
    listener:
      concurrency: 3                  # 3 个消费线程
      ack-mode: manual               # 手动确认
```

## 基础消费者

```java
@Component
public class OrderConsumer {

    @KafkaListener(topics = "order-topic", groupId = "order-consumer-group")
    public void onMessage(ConsumerRecord<String, Order> record) {
        log.info("收到消息: partition={}, offset={}, key={}, value={}",
            record.partition(), record.offset(), record.key(), record.value());

        try {
            processOrder(record.value());
        } catch (Exception e) {
            log.error("处理失败: {}", e.getMessage(), e);
            // 异常会触发重试或放入死信队列
            throw e;
        }
    }

    private void processOrder(Order order) {
        // 业务处理逻辑
    }
}
```

## 手动提交 Offset (推荐)

```java
@Component
public class ManualAckConsumer {

    @KafkaListener(topics = "order-topic", groupId = "order-consumer-group")
    public void onMessage(ConsumerRecord<String, Order> record,
                          Acknowledgment ack) {
        try {
            processOrder(record.value());
            ack.acknowledge();  // 处理成功才提交
        } catch (Exception e) {
            log.error("处理失败, Offset 不提交, 消息会被重新消费", e);
            // 不调用 ack.acknowledge()，消息会被重新 poll
        }
    }
}
```

## 批量消费

```java
@Component
public class BatchConsumer {

    @KafkaListener(topics = "order-topic", groupId = "batch-consumer-group")
    public void onMessage(List<ConsumerRecord<String, Order>> records,
                          Acknowledgment ack) {
        log.info("批量收到 {} 条消息", records.size());

        List<Order> orders = new ArrayList<>();
        for (ConsumerRecord<String, Order> record : records) {
            orders.add(record.value());
        }

        try {
            orderService.batchProcess(orders);  // 批量处理（入库）
            ack.acknowledge();                  // 成功才提交
        } catch (Exception e) {
            log.error("批量处理失败", e);
        }
    }
}
```

```yaml
spring:
  kafka:
    listener:
      type: batch              # 批量模式
    consumer:
      max-poll-records: 100    # 每次拉取 100 条
```

## 错误处理与重试

```java
@Configuration
public class KafkaConsumerConfig {

    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, Order> factory(
            ConsumerFactory<String, Order> consumerFactory) {
        
        ConcurrentKafkaListenerContainerFactory<String, Order> factory =
            new ConcurrentKafkaListenerContainerFactory<>();
        factory.setConsumerFactory(consumerFactory);
        factory.setConcurrency(3);

        // --- 错误处理策略 ---

        // 1. SeekToCurrentErrorHandler (Spring Kafka 2.x)
        // 失败后重新消费当前消息，最多重试 3 次
        // factory.setCommonErrorHandler(
        //     new DefaultErrorHandler((record, exception) -> {
        //         log.error("重试耗尽: {}", record, exception);
        //     }, new FixedBackOff(1000L, 3)));

        // 2. 死信队列 (推荐)
        DeadLetterPublishingRecoverer recoverer = new DeadLetterPublishingRecoverer(
            new KafkaTemplate<>(consumerFactory),
            (record, exception) -> new TopicPartition(
                record.topic() + ".DLT", record.partition()));
        
        factory.setCommonErrorHandler(
            new DefaultErrorHandler(recoverer, new FixedBackOff(3000L, 5)));
        
        return factory;
    }
}
```

## 消费指定分区的消息

```java
@Component
public class SpecificPartitionConsumer {

    @KafkaListener(
        topicPartitions = @TopicPartition(
            topic = "order-topic",
            partitions = {"0", "1"}     // 只消费分区 0 和 1
        ))
    public void onMessage(ConsumerRecord<String, Order> record) {
        processOrder(record.value());
    }
}
```

## 消费者监听器生命周期

```java
@Component
public class LifecycleConsumer {

    @KafkaListener(topics = "order-topic", groupId = "order-group")
    public void onMessage(ConsumerRecord<String, Order> record) {
        // 消费逻辑
    }

    @PostConstruct
    public void init() {
        log.info("消费者初始化");
    }

    @PreDestroy
    public void destroy() {
        log.info("消费者销毁");
    }
}
```

## 消费最佳实践

| 实践 | 说明 |
|------|------|
| 手动提交 + 异步提交 | 处理完消息再提交，不丢进度 |
| 死信队列兜底 | 多次重试失败的消息放 DLT |
| 幂等消费 | 业务层处理重复消息 |
| 监控消费 Lag | 及时发现消费积压 |
| 控制 `max.poll.records` | 防止一次拉取过多 |
| 消费者线程数 ≤ 分区数 | 多余线程空闲 |
