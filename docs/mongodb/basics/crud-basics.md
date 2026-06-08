# MongoDB CRUD 基础

## 插入文档

```javascript
// 插入单条
db.users.insertOne({
  name: "张三",
  email: "zhangsan@example.com",
  age: 28,
  tags: ["Java", "MongoDB"],
  createdAt: new Date()
})

// 插入多条
db.users.insertMany([
  { name: "李四", email: "lisi@example.com", age: 25 },
  { name: "王五", email: "wangwu@example.com", age: 30 }
])

// 返回结果
{
  "acknowledged": true,
  "insertedIds": {
    "0": ObjectId("..."),
    "1": ObjectId("..."),
    "2": ObjectId("...")
  }
}
```

## 查询文档

```javascript
// === 基础查询 ===
db.users.find()                          // 查询全部
db.users.findOne({ name: "张三" })       // 查询一条
db.users.find({ age: { $gt: 25 } })      // age > 25

// === 比较操作符 ===
db.users.find({ age: { $gte: 25, $lte: 35 } })  // 25 <= age <= 35
db.users.find({ name: { $ne: "张三" } })          // name != "张三"
db.users.find({ age: { $in: [25, 28, 30] } })    // age in (25,28,30)

// === 逻辑操作符 ===
db.users.find({
  $and: [{ age: { $gte: 25 } }, { age: { $lte: 35 } }]
})
db.users.find({
  $or: [{ name: "张三" }, { email: /@example\.com$/ }]
})
db.users.find({
  age: { $not: { $lt: 25 } }   // NOT (age < 25) → age >= 25
})

// === 嵌套查询 ===
db.users.find({ "address.city": "上海" })  // 嵌套字段精确匹配

// === 数组查询 ===
db.users.find({ tags: "Java" })            // 数组包含 "Java"
db.users.find({ tags: { $all: ["Java", "MongoDB"] } })  // 包含所有
db.users.find({ tags: { $size: 3 } })      // 数组长度 = 3
db.users.find({ "tags.0": "Java" })        // 第一个元素 = "Java"

// === 字段选择 ===
db.users.find({}, { name: 1, email: 1, _id: 0 })  // 只返回 name 和 email

// === 排序与分页 ===
db.users.find().sort({ age: -1 })          // 按年龄降序
db.users.find().skip(10).limit(10)         // 第2页 (共10条/页)
```

### 常用查询操作符速查

| 操作符 | 含义 | 示例 |
|--------|------|------|
| `$eq` | 等于 | `{ age: { $eq: 25 } }` |
| `$ne` | 不等于 | `{ name: { $ne: "张三" } }` |
| `$gt` / `$gte` | 大于/大于等于 | `{ age: { $gt: 25 } }` |
| `$lt` / `$lte` | 小于/小于等于 | `{ age: { $lt: 35 } }` |
| `$in` / `$nin` | 在/不在列表中 | `{ age: { $in: [25,30] } }` |
| `$exists` | 字段存在 | `{ phone: { $exists: true } }` |
| `$regex` | 正则匹配 | `{ name: /^张/ }` |
| `$elemMatch` | 数组元素匹配 | `{ scores: { $elemMatch: { $gte: 90 } } }` |

## 更新文档

```javascript
// === 更新单条 ===
db.users.updateOne(
  { _id: ObjectId("...") },
  { $set: { age: 29, email: "newemail@example.com" } }
)

// === 更新多条 ===
db.users.updateMany(
  { age: { $lt: 30 } },
  { $inc: { age: 1 } }    // 所有 age < 30 的 +1
)

// === 常用更新操作符 ===
{ $set: { field: value } }       // 设置字段值
{ $unset: { field: "" } }        // 删除字段
{ $inc: { count: 1 } }           // 数值自增
{ $push: { tags: "new-tag" } }   // 数组追加
{ $pull: { tags: "old-tag" } }   // 数组移除
{ $addToSet: { tags: "tag" } }   // 数组去重追加
{ $pop: { tags: 1 } }            // 1=删除最后一个, -1=删除第一个

// === upsert (有则更新, 无则插入) ===
db.users.updateOne(
  { email: "newuser@example.com" },
  { $set: { name: "新用户", age: 20 }, $setOnInsert: { createdAt: new Date() } },
  { upsert: true }
)
```

## 删除文档

```javascript
// 删除单条
db.users.deleteOne({ _id: ObjectId("...") })

// 删除多条
db.users.deleteMany({ age: { $lt: 18 } })

// 删除集合中所有文档
db.users.deleteMany({})
// 或直接删除集合
db.users.drop()
```

## Java 示例

```java
// Spring Data MongoDB
@Autowired
private MongoTemplate mongoTemplate;

// 查询
Query query = new Query(Criteria.where("age").gte(25).lte(35));
List<User> users = mongoTemplate.find(query, User.class);

// 更新
Update update = new Update()
    .set("age", 29)
    .inc("loginCount", 1);
mongoTemplate.updateFirst(
    Query.query(Criteria.where("_id").is(id)),
    update,
    User.class);

// 聚合查询
MatchOperation matchStage = Aggregation.match(
    Criteria.where("age").gte(25));
GroupOperation groupStage = Aggregation.group("city")
    .count().as("count")
    .avg("age").as("avgAge");
Aggregation agg = Aggregation.newAggregation(matchStage, groupStage);
List<CityStats> results = mongoTemplate.aggregate(agg, "users", CityStats.class)
    .getMappedResults();
```
