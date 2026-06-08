# Spring Data MongoDB

## 配置文件

```yaml
spring:
  data:
    mongodb:
      uri: mongodb://admin:admin123@localhost:27017/shop
      # 或分开配置:
      # host: localhost
      # port: 27017
      # database: shop
      # username: admin
      # password: admin123
```

## 实体映射

```java
@Document(collection = "users")  // 指定集合名
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User {

    @Id                          // 主键 (映射 _id)
    private String id;           // ObjectId 的字符串形式

    @Field("name")               // 指定字段名 (可选)
    private String name;

    @Indexed(unique = true)      // 创建唯一索引
    private String email;

    private Integer age;

    @CreatedDate                  // 自动填充创建时间
    private Instant createdAt;

    @LastModifiedDate             // 自动填充更新时间
    private Instant updatedAt;

    private List<String> tags;

    private Address address;      // 内嵌文档
}

@Data
public class Address {
    private String city;
    private String street;
}
```

## Repository 模式

```java
@Repository
public interface UserRepository extends MongoRepository<User, String> {

    // === 方法命名自动查询 ===
    List<User> findByName(String name);

    List<User> findByAgeGreaterThan(int age);

    List<User> findByNameAndAge(String name, int age);

    List<User> findByTagsContaining(String tag);

    List<User> findByAddressCity(String city);

    // === 分页排序 ===
    Page<User> findByAgeBetween(int min, int max, Pageable pageable);

    // === 自定义 Query ===
    @Query("{ 'age': { $gte: ?0, $lte: ?1 } }")
    List<User> findByAgeRange(int min, int max);

    @Query(value = "{ 'age': { $gte: ?0 } }", fields = "{ 'name': 1, 'email': 1 }")
    List<UserDto> findNamesByAge(int age);

    // === 更新操作 ===
    @Update("{ '$inc': { 'age': 1 } }")
    @Query("{ 'name': ?0 }")
    long incrementAge(String name);
}
```

### 使用示例

```java
@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    public User createUser(CreateUserDto dto) {
        User user = User.builder()
            .name(dto.getName())
            .email(dto.getEmail())
            .age(dto.getAge())
            .tags(dto.getTags())
            .address(dto.getAddress())
            .build();
        return userRepository.save(user);
    }

    public List<User> findAdultUsers(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("age").descending());
        return userRepository.findByAgeBetween(18, 60, pageable).getContent();
    }

    public List<User> findByCity(String city) {
        return userRepository.findByAddressCity(city);
    }
}
```

## MongoTemplate

```java
@Service
public class AdvancedUserService {

    @Autowired
    private MongoTemplate mongoTemplate;

    // 复杂查询
    public List<User> complexQuery(String city, List<String> tags) {
        Query query = new Query();
        query.addCriteria(Criteria.where("address.city").is(city));
        query.addCriteria(Criteria.where("tags").in(tags));
        query.addCriteria(Criteria.where("age").gte(18));
        query.with(Sort.by(Sort.Direction.DESC, "createdAt"));
        query.limit(20);

        return mongoTemplate.find(query, User.class);
    }

    // 部分更新
    public UpdateResult updateTags(String userId, String newTag) {
        Query query = Query.query(Criteria.where("id").is(userId));
        Update update = new Update()
            .addToSet("tags", newTag)
            .set("updatedAt", Instant.now());
        return mongoTemplate.updateFirst(query, update, User.class);
    }

    // Bulk 批量写入
    public BulkWriteResult bulkInsert(List<User> users) {
        List<WriteModel<User>> writes = users.stream()
            .map(user -> new InsertOneModel<>(user))
            .collect(Collectors.toList());
        return mongoTemplate.bulkOps(BulkOperations.BulkMode.UNORDERED, User.class)
            .insert(users)
            .execute();
    }

    // 分页查询
    public Page<User> paginatedQuery(int page, int size) {
        Query query = new Query().with(PageRequest.of(page, size));
        long count = mongoTemplate.count(query, User.class);
        List<User> users = mongoTemplate.find(query, User.class);
        return new PageImpl<>(users, PageRequest.of(page, size), count);
    }
}
```

## 开启审计

```java
@Configuration
@EnableMongoAuditing  // ← 启用 @CreatedDate / @LastModifiedDate
public class MongoConfig {
}
```

## 开启事务

```java
@Configuration
public class MongoTxnConfig {

    @Bean
    public MongoTransactionManager transactionManager(
            MongoDatabaseFactory dbFactory) {
        return new MongoTransactionManager(dbFactory);
    }
}

// 使用
@Service
public class OrderService {

    @Transactional
    public Order createOrder(OrderDto dto) {
        orderRepository.save(order);
        inventoryRepository.deductStock(dto.getItems());
        return order;
    }
}
```

::: tip Repository vs Template
- **Repository**: 适合标准 CRUD，方法名自动推导
- **MongoTemplate**: 适合复杂查询、聚合管道、批量操作
- 实际项目中两者配合使用
:::
