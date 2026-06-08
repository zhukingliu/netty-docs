# MongoDB 副本集部署

## Docker Compose 部署

```yaml
# docker-compose.yml
version: '3.8'

services:
  mongo1:
    image: mongo:7
    container_name: mongo1
    command: mongod --replSet rs0 --bind_ip_all --port 27017
    ports:
      - "27017:27017"
    volumes:
      - mongo1_data:/data/db
    networks:
      - mongo-net
    healthcheck:
      test: echo "db.runCommand('ping').ok" | mongosh --quiet
      interval: 10s
      timeout: 5s
      retries: 5

  mongo2:
    image: mongo:7
    container_name: mongo2
    command: mongod --replSet rs0 --bind_ip_all --port 27017
    ports:
      - "27018:27017"
    volumes:
      - mongo2_data:/data/db
    networks:
      - mongo-net

  mongo3:
    image: mongo:7
    container_name: mongo3
    command: mongod --replSet rs0 --bind_ip_all --port 27017
    ports:
      - "27019:27017"
    volumes:
      - mongo3_data:/data/db
    networks:
      - mongo-net

volumes:
  mongo1_data:
  mongo2_data:
  mongo3_data:

networks:
  mongo-net:
    driver: bridge
```

```bash
# 启动
docker-compose up -d

# 等待 mongo1 健康检查通过后，初始化副本集
docker exec -it mongo1 mongosh

# 在 mongosh 中执行:
rs.initiate({
  _id: "rs0",
  members: [
    { _id: 0, host: "mongo1:27017", priority: 2 },
    { _id: 1, host: "mongo2:27017", priority: 1 },
    { _id: 2, host: "mongo3:27017", priority: 0 }  // 仅参与投票
  ]
})
```

## 副本集状态管理

```javascript
// 查看副本集状态
rs.status()

// 输出关键信息:
{
  "set": "rs0",
  "members": [
    { "_id": 0, "name": "mongo1:27017", "stateStr": "PRIMARY", "health": 1 },
    { "_id": 1, "name": "mongo2:27017", "stateStr": "SECONDARY", "health": 1 },
    { "_id": 2, "name": "mongo3:27017", "stateStr": "SECONDARY", "health": 1 }
  ]
}

// 查看 Oplog 状态
db.getReplicationInfo()

// 查看 Secondary 同步延迟
rs.printSecondaryReplicationInfo()
```

## 连接副本集

```
# Java 连接字符串
mongodb://mongo1:27017,mongo2:27018,mongo3:27019/?replicaSet=rs0

# Spring Boot 配置
spring:
  data:
    mongodb:
      uri: mongodb://mongo1:27017,mongo2:27018,mongo3:27019/shop?replicaSet=rs0
```

```java
// Spring Data 副本集配置
@Configuration
public class MongoReplicaConfig {

    @Bean
    public MongoClient mongoClient() {
        return MongoClients.create(
            MongoClientSettings.builder()
                .applyConnectionString(new ConnectionString(
                    "mongodb://localhost:27017,localhost:27018,localhost:27019" +
                    "/?replicaSet=rs0&w=majority&readPreference=primaryPreferred"))
                .build()
        );
    }
}
```

## 故障模拟

```bash
# 1. 停止 Primary
docker stop mongo1

# 2. 观察副本集状态
docker exec -it mongo2 mongosh --eval "rs.status()"

# 3. 看到 mongo2 或 mongo3 成为新 Primary
# 故障转移在 10 秒内完成

# 4. 恢复 mongo1
docker start mongo1
# mongo1 作为 Secondary 重新加入
```

## 关键配置

```yaml
# mongod.conf 关键配置
replication:
  replSetName: rs0
  
  # Oplog 大小（默认磁盘的 5%）
  oplogSizeMB: 10240

net:
  port: 27017
  bindIp: 0.0.0.0

storage:
  dbPath: /data/db
  journal:
    enabled: true
  wiredTiger:
    engineConfig:
      cacheSizeGB: 2
```

## 生产清单

| 检查项 | 说明 |
|--------|------|
| 节点数 ≥ 3 | 保证多数投票 |
| Oplog 足够大 | 容错 Secondary 追数据的时间窗口 |
| 监控同步延迟 | `rs.printSecondaryReplicationInfo()` |
| 配置 Keyfile | 副本集节点间认证 |
| 测试故障转移 | 实际停止 Primary 验证切换时间 |
| 备份策略 | mongodump 定时备份 |

::: tip
副本集的读负载分担通过 `readPreference=secondaryPreferred` 实现，但要注意 Secondary 数据可能有延迟。
:::
