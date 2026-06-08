# Spring Boot 集成 gRPC

## 依赖配置

```xml
<parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>3.3.0</version>
</parent>

<dependencies>
    <!-- gRPC Spring Boot Starter -->
    <dependency>
        <groupId>net.devh</groupId>
        <artifactId>grpc-server-spring-boot-starter</artifactId>
        <version>3.1.0.RELEASE</version>
    </dependency>
    <dependency>
        <groupId>net.devh</groupId>
        <artifactId>grpc-client-spring-boot-autoconfigure</artifactId>
        <version>3.1.0.RELEASE</version>
    </dependency>

    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
</dependencies>
```

## 配置文件

```yaml
# application.yml
spring:
  application:
    name: user-service

grpc:
  server:
    port: 9090                       # gRPC 服务端口
    max-inbound-message-size: 10MB
  
  client:
    order-service:
      address: static://localhost:9091  # 调用 order-service
      negotiation-type: plaintext
    payment-service:
      address: dns:///payment-service:9092
      negotiation-type: plaintext
```

## 服务端

```java
// UserServiceImpl.java
@GrpcService  // ← 替代 @Service, 自动注册到 gRPC Server
public class UserGrpcService extends UserServiceGrpc.UserServiceImplBase {

    @Autowired
    private UserRepository userRepository;

    @Override
    public void createUser(CreateUserRequest request,
                           StreamObserver<UserResponse> responseObserver) {
        UserEntity entity = UserEntity.builder()
            .name(request.getName())
            .email(request.getEmail())
            .age(request.getAge())
            .build();

        UserEntity saved = userRepository.save(entity);

        UserResponse response = UserResponse.newBuilder()
            .setSuccess(true)
            .setMessage("用户创建成功")
            .setUser(toProto(saved))
            .build();

        responseObserver.onNext(response);
        responseObserver.onCompleted();
    }

    @Override
    public void getUser(GetUserRequest request,
                        StreamObserver<UserResponse> responseObserver) {
        userRepository.findById(request.getId())
            .ifPresentOrElse(
                user -> {
                    responseObserver.onNext(UserResponse.newBuilder()
                        .setSuccess(true)
                        .setUser(toProto(user))
                        .build());
                    responseObserver.onCompleted();
                },
                () -> {
                    responseObserver.onError(
                        Status.NOT_FOUND
                            .withDescription("用户不存在: " + request.getId())
                            .asRuntimeException());
                }
            );
    }

    private User toProto(UserEntity entity) {
        return User.newBuilder()
            .setId(entity.getId())
            .setName(entity.getName())
            .setEmail(entity.getEmail())
            .setAge(entity.getAge())
            .build();
    }
}
```

## 全局异常拦截器

```java
@GrpcAdvice  // Spring gRPC 的全局异常处理
public class GrpcExceptionHandler {

    @GrpcExceptionHandler(IllegalArgumentException.class)
    public Status handleIllegalArgument(IllegalArgumentException e) {
        return Status.INVALID_ARGUMENT.withDescription(e.getMessage());
    }

    @GrpcExceptionHandler(EntityNotFoundException.class)
    public Status handleNotFound(EntityNotFoundException e) {
        return Status.NOT_FOUND.withDescription(e.getMessage());
    }

    @GrpcExceptionHandler(Exception.class)
    public Status handleGeneral(Exception e) {
        return Status.INTERNAL
            .withDescription("服务器内部错误")
            .withCause(e);
    }
}
```

## 客户端调用其他 gRPC 服务

```java
@Service
public class OrderServiceClient {

    @GrpcClient("order-service")  // ← 自动注入 Stub
    private OrderServiceGrpc.OrderServiceBlockingStub orderStub;

    public Order getOrder(long orderId) {
        GetOrderRequest request = GetOrderRequest.newBuilder()
            .setId(orderId)
            .build();

        OrderResponse response = orderStub.getOrder(request);
        return toDomain(response.getOrder());
    }
}
```

## 带拦截器的客户端配置

```java
@Configuration
public class GrpcClientConfig {

    @GrpcClient("order-service")
    private ManagedChannel orderChannel;

    @Bean
    public OrderServiceGrpc.OrderServiceBlockingStub orderStub() {
        return OrderServiceGrpc.newBlockingStub(orderChannel)
            .withDeadline(Deadline.after(5, TimeUnit.SECONDS));
    }
}
```

## REST 转 gRPC 的 Controller

```java
@RestController
@RequestMapping("/api/users")
public class UserController {

    @GrpcClient("user-service")
    private UserServiceGrpc.UserServiceBlockingStub userStub;

    @PostMapping
    public ResponseEntity<User> create(@RequestBody CreateUserDto dto) {
        CreateUserRequest request = CreateUserRequest.newBuilder()
            .setName(dto.getName())
            .setEmail(dto.getEmail())
            .setAge(dto.getAge())
            .build();

        UserResponse response = userStub.createUser(request);

        return ResponseEntity.ok(response.getUser());
    }

    @GetMapping("/{id}")
    public ResponseEntity<User> get(@PathVariable Long id) {
        GetUserRequest request = GetUserRequest.newBuilder()
            .setId(id)
            .build();

        UserResponse response = userStub.getUser(request);

        return ResponseEntity.ok(response.getUser());
    }
}
```

## 完整项目结构

```
src/
├── main/
│   ├── proto/                          ← proto 文件
│   │   └── user_service.proto
│   ├── java/com/example/user/
│   │   ├── UserServiceApplication.java
│   │   ├── service/
│   │   │   └── UserGrpcService.java    ← @GrpcService
│   │   ├── interceptor/
│   │   │   └── GrpcExceptionHandler.java ← @GrpcAdvice
│   │   └── controller/
│   │       └── UserController.java      ← REST → gRPC 网关
│   └── resources/
│       └── application.yml
└── test/
    └── java/
        └── UserGrpcServiceTest.java
```

## gRPC Spring Boot Starter 关键注解

| 注解 | 位置 | 作用 |
|------|------|------|
| `@GrpcService` | 服务端 | 注册 gRPC 服务实现 |
| `@GrpcClient` | 客户端 | 注入 gRPC Stub |
| `@GrpcAdvice` | 服务端 | 全局异常拦截 |
| `@GrpcExceptionHandler` | 方法 | 处理特定异常类型 |

::: tip
`grpc-server-spring-boot-starter` 和 `grpc-client-spring-boot-autoconfigure` 是同一依赖，可作为服务端和客户端使用。
:::
