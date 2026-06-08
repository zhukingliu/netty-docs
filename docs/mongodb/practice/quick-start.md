# MongoDB Docker 快速入门

## Docker 启动

```bash
# 拉取并启动 MongoDB
docker run -d --name mongodb \
  -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=admin123 \
  mongo:7

# 进入容器
docker exec -it mongodb bash

# 连接
mongosh -u admin -p admin123
```

## MongoDB Shell (mongosh)

### 数据库操作

```javascript
// 查看所有数据库
show dbs

// 切换/创建数据库 (延迟创建, 数据写入时才创建)
use shop

// 查看当前数据库
db.getName()

// 删除数据库
db.dropDatabase()
```

### 集合操作

```javascript
// 创建集合
db.createCollection("users")

// 查看所有集合
show collections

// 删除集合
db.users.drop()
```

### 文档操作速查

```javascript
// === 插入 ===
db.users.insertOne({ name: "张三", age: 28 })
db.users.insertMany([
  { name: "李四", age: 25 },
  { name: "王五", age: 30 }
])

// === 查询 ===
db.users.find({ age: { $gte: 25 } })
db.users.findOne({ name: "张三" })
db.users.countDocuments({ age: { $gte: 25 } })

// === 更新 ===
db.users.updateOne(
  { name: "张三" },
  { $set: { age: 29 }, $inc: { version: 1 } }
)

// === 删除 ===
db.users.deleteOne({ name: "张三" })
db.users.deleteMany({ age: { $lt: 18 } })

// === 聚合 ===
db.orders.aggregate([
  { $match: { status: "completed" } },
  { $group: { _id: "$userId", total: { $sum: "$amount" } } }
])
```

## MongoDB Compass (GUI)

官方可视化管理工具，免费下载：

```bash
# 连接字符串
mongodb://admin:admin123@localhost:27017/
```

功能：浏览数据、创建索引、聚合管道可视化、性能监控、Schema 分析。

## 导入/导出

```bash
# 导出 JSON
mongoexport --uri="mongodb://localhost:27017/shop" \
  --collection=users --out=users.json

# 导入 JSON
mongoimport --uri="mongodb://localhost:27017/shop" \
  --collection=users --file=users.json

# 二进制备份
mongodump --uri="mongodb://localhost:27017" --db=shop \
  --out=/backup/
mongorestore --uri="mongodb://localhost:27017" /backup/
```
