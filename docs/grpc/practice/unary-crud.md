# gRPC 一元 CRUD

## Proto 定义

```protobuf
syntax = "proto3";

option java_package = "com.example.user";
option java_multiple_files = true;

package user;

service UserService {
    rpc CreateUser (CreateUserRequest) returns (UserResponse);
    rpc GetUser (GetUserRequest) returns (UserResponse);
    rpc UpdateUser (UpdateUserRequest) returns (UserResponse);
    rpc DeleteUser (DeleteUserRequest) returns (DeleteUserResponse);
    rpc ListUsers (ListUsersRequest) returns (ListUsersResponse);
}

message User {
    int64 id = 1;
    string name = 2;
    string email = 3;
    int32 age = 4;
}

message CreateUserRequest {
    string name = 1;
    string email = 2;
    int32 age = 3;
}

message GetUserRequest {
    int64 id = 1;
}

message UpdateUserRequest {
    int64 id = 1;
    string name = 2;
    string email = 3;
    int32 age = 4;
}

message DeleteUserRequest {
    int64 id = 1;
}

message ListUsersRequest {
    int32 page = 1;
    int32 page_size = 2;
}

message UserResponse {
    bool success = 1;
    string message = 2;
    User user = 3;
}

message DeleteUserResponse {
    bool success = 1;
    string message = 2;
}

message ListUsersResponse {
    repeated User users = 1;
    int32 total = 2;
}
```

## 服务端实现

```java
public class UserServiceImpl extends UserServiceGrpc.UserServiceImplBase {

    private final Map<Long, User> userStore = new ConcurrentHashMap<>();
    private final AtomicLong idGenerator = new AtomicLong(1);

    @Override
    public void createUser(CreateUserRequest request,
                           StreamObserver<UserResponse> responseObserver) {
        long id = idGenerator.getAndIncrement();
        User user = User.newBuilder()
            .setId(id)
            .setName(request.getName())
            .setEmail(request.getEmail())
            .setAge(request.getAge())
            .build();
        userStore.put(id, user);

        UserResponse response = UserResponse.newBuilder()
            .setSuccess(true)
            .setMessage("用户创建成功")
            .setUser(user)
            .build();

        responseObserver.onNext(response);
        responseObserver.onCompleted();
    }

    @Override
    public void getUser(GetUserRequest request,
                        StreamObserver<UserResponse> responseObserver) {
        User user = userStore.get(request.getId());

        UserResponse.Builder builder = UserResponse.newBuilder();
        if (user != null) {
            builder.setSuccess(true)
                   .setMessage("查询成功")
                   .setUser(user);
        } else {
            builder.setSuccess(false)
                   .setMessage("用户不存在: " + request.getId());
        }
        responseObserver.onNext(builder.build());
        responseObserver.onCompleted();
    }

    @Override
    public void updateUser(UpdateUserRequest request,
                           StreamObserver<UserResponse> responseObserver) {
        User existing = userStore.get(request.getId());
        if (existing == null) {
            responseObserver.onNext(UserResponse.newBuilder()
                .setSuccess(false)
                .setMessage("用户不存在")
                .build());
            responseObserver.onCompleted();
            return;
        }

        User updated = existing.toBuilder()
            .setName(request.getName().isEmpty() ? existing.getName() : request.getName())
            .setEmail(request.getEmail().isEmpty() ? existing.getEmail() : request.getEmail())
            .setAge(request.getAge() > 0 ? request.getAge() : existing.getAge())
            .build();
        userStore.put(request.getId(), updated);

        responseObserver.onNext(UserResponse.newBuilder()
            .setSuccess(true)
            .setMessage("更新成功")
            .setUser(updated)
            .build());
        responseObserver.onCompleted();
    }

    @Override
    public void listUsers(ListUsersRequest request,
                          StreamObserver<ListUsersResponse> responseObserver) {
        int page = request.getPage() > 0 ? request.getPage() : 1;
        int pageSize = request.getPageSize() > 0 ? request.getPageSize() : 10;

        List<User> users = userStore.values().stream()
            .skip((long) (page - 1) * pageSize)
            .limit(pageSize)
            .collect(Collectors.toList());

        responseObserver.onNext(ListUsersResponse.newBuilder()
            .addAllUsers(users)
            .setTotal(userStore.size())
            .build());
        responseObserver.onCompleted();
    }
}
```

## 客户端调用

```java
public class UserServiceClient {
    private final UserServiceGrpc.UserServiceBlockingStub stub;

    public UserServiceClient(ManagedChannel channel) {
        this.stub = UserServiceGrpc.newBlockingStub(channel)
            .withDeadline(Deadline.after(5, TimeUnit.SECONDS));
    }

    public User createUser(String name, String email, int age) {
        UserResponse response = stub.createUser(CreateUserRequest.newBuilder()
            .setName(name).setEmail(email).setAge(age).build());
        checkSuccess(response);
        return response.getUser();
    }

    public User getUser(long id) {
        UserResponse response = stub.getUser(
            GetUserRequest.newBuilder().setId(id).build());
        checkSuccess(response);
        return response.getUser();
    }

    public List<User> listUsers(int page, int pageSize) {
        ListUsersResponse response = stub.listUsers(
            ListUsersRequest.newBuilder()
                .setPage(page).setPageSize(pageSize).build());
        return response.getUsersList();
    }

    private void checkSuccess(UserResponse response) {
        if (!response.getSuccess()) {
            throw new RuntimeException("操作失败: " + response.getMessage());
        }
    }

    public static void main(String[] args) {
        ManagedChannel channel = ManagedChannelBuilder
            .forAddress("localhost", 8080)
            .usePlaintext()
            .build();

        try {
            UserServiceClient client = new UserServiceClient(channel);

            User alice = client.createUser("Alice", "alice@example.com", 25);
            System.out.println("创建: " + alice);

            User found = client.getUser(alice.getId());
            System.out.println("查询: " + found);

            client.listUsers(1, 10).forEach(u ->
                System.out.println("列表: " + u));

        } finally {
            channel.shutdown();
        }
    }
}
```

## Builder 模式

Protobuf 生成的消息类都是**不可变**的，通过 Builder 创建和修改：

```java
// 创建
User user = User.newBuilder()
    .setId(1)
    .setName("Bob")
    .setEmail("bob@example.com")
    .setAge(30)
    .build();

// 从已有对象创建 Builder（修改部分字段）
User updated = user.toBuilder()
    .setAge(31)       // 只改 age
    .clearEmail()     // 清除 email 字段
    .build();
```

::: tip
gRPC + Protobuf 默认生成不可变 Java Bean，配合 Builder 提供类型安全的 API，避免了传统 setter/getter 的空值问题。
:::
