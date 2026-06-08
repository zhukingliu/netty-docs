# Spring Boot 集成 Kafka 生产者

## 项目依赖

```xml
<dependency>
    <groupId>org.springframework.kafka</groupId>
    <artifactId>spring-kafka</artifactId>
</dependency>
<!-- Spring Boot 2.x/3.x 会自动引入 -->
```

## 配置文件

```yaml
# application.yml
spring:
  kafka:
    bootstrap-servers: localhost:9092
    producer:
      # 序列化
      key-serializer: org.apache.kafka.common.serialization.StringSerializer
      value-serializer: org.springframework.kafka.support.serializer.JsonSerializer
      
      # 可靠性
      acks: all
      enable-idempotence: true
      
      # 性能
      batch-size: 32768       # 32KB
      linger-ms: 10           # 等待 10ms 凑批
      compression-type: lz4
      buffer-memory: 67108864 # 64MB
      
      # 重试
      retries: 3
```

## 发送消息

### 基础发送

```java
@Service
public class OrderProducer {

    @Autowired
    private KafkaTemplate<String, Order> kafkaTemplate;

    public void sendOrder(Order order) {
        // 简单发送
        kafkaTemplate.send("order-topic", order);
    }

    public void sendWithKey(Order order) {
        // 带 Key 发送（确保同一订单的消息发往同一分区）
        kafkaTemplate.send("order-topic", order.getOrderId(), order);
    }

    public void sendWithPartition(Order order) {
        // 指定分区
        kafkaTemplate.send("order-topic", 0, order.getOrderId(), order);
    }
}
```

### 异步发送 + 回调 (推荐)

```java
@Component
public class AsyncOrderProducer {

    private final KafkaTemplate<String, Order> kafkaTemplate;

    public AsyncOrderProducer(KafkaTemplate<String, Order> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }

    public void sendOrderAsync(Order order) {
        CompletableFuture<SendResult<String, Order>> future = 
            kafkaTemplate.send("order-topic", order.getOrderId(), order);

        future.thenAccept(result -> {
            SendResult<String, Order> sendResult = result;
            RecordMetadata meta = sendResult.getRecordMetadata();
            log.info("发送成功: topic={}, partition={}, offset={}",
                meta.topic(), meta.partition(), meta.offset());
        }).exceptionally(ex -> {
            log.error("发送失败: {}", ex.getMessage(), ex);
            // 保存到数据库/缓存，后续补偿
            saveToRetryTable(order);
            return null;
        });
    }
}
```

### 同步发送

```java
public SendResult<String, Order> sendOrderSync(Order order) {
    try {
        return kafkaTemplate.send("order-topic", order.getOrderId(), order)
            .get(3, TimeUnit.SECONDS);  // 最多等 3 秒
    } catch (InterruptedException | ExecutionException | TimeoutException e) {
        throw new RuntimeException("发送失败", e);
    }
}
```

## 自定义配置

```java
@Configuration
public class KafkaProducerConfig {

    @Bean
    public ProducerFactory<String, Order> producerFactory() {
        Map<String, Object> config = new HashMap<>();
        config.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, "localhost:9092");
        config.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
        config.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, JsonSerializer.class);
        config.put(ProducerConfig.ACKS_CONFIG, "all");
        config.put(ProducerConfig.ENABLE_IDEMPOTENCE_CONFIG, true);
        config.put(ProducerConfig.COMPRESSION_TYPE_CONFIG, "lz4");
        
        // 自定义分区器
        // config.put(ProducerConfig.PARTITIONER_CLASS_CONFIG, MyPartitioner.class);
        
        return new DefaultKafkaProducerFactory<>(config);
    }

    @Bean
    public KafkaTemplate<String, Order> kafkaTemplate() {
        return new KafkaTemplate<>(producerFactory());
    }
}
```

## 事务生产者

```java
@Service
public class TransactionalOrderService {

    @Autowired
    private KafkaTemplate<String, Order> kafkaTemplate;

    @Transactional  // Spring Kafka 事务管理
    public void processAndSend(Order order) {
        // 1. 写入数据库
        orderRepository.save(order);

        // 2. 发送 Kafka 消息（与 DB 在同一个事务中）
        kafkaTemplate.send("order-topic", order.getOrderId(), order);
        kafkaTemplate.send("notification-topic", "New order: " + order.getOrderId());
    }
}
```

```yaml
# 事务配置
spring:
  kafka:
    producer:
      transactional-id-prefix: tx-order-
      enable-idempotence: true
```

## 消息发送最佳实践

| 实践 | 说明 |
|------|------|
| 使用 `log4j`/`slf4j` 记录发送结果 | 方便排查问题 |
| 异步 + 回调优于同步 | 不阻塞主线程 |
| 启用压缩 (`lz4`) | 减少网络带宽 |
| 合理设置 `batch.size` + `linger.ms` | 平衡延迟与吞吐 |
| 失败消息落地 (DB/Redis) | 实现最终可靠性 |
| 监控发送成功率、延迟 | 及时发现问题 |
