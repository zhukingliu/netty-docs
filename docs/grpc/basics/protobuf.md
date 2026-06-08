# Protocol Buffers

Protocol Buffers (protobuf) 是 gRPC 的**接口定义语言 (IDL)** 和**序列化格式**。

## 什么是 Protobuf

- 定义数据结构和服务接口的 `.proto` 文件
- 编译器 `protoc` 自动生成各语言的代码
- 二进制序列化格式，比 JSON 小 3-10 倍，速度快 20-100 倍

## Proto 基础语法

### 消息定义

```protobuf
syntax = "proto3";                       // 使用 proto3 语法

package com.example.greeter;             // 包名（防止命名冲突）

option java_package = "com.example.grpc"; // Java 包名
option java_multiple_files = true;        // 每个消息一个 Java 文件

// 定义一个消息
message HelloRequest {
    string name = 1;                     // 字段编号 = 1
    int32 age = 2;                       // 字段编号 = 2
    repeated string hobbies = 3;         // repeated = 数组
}

message HelloResponse {
    string message = 1;
}
```

### 字段类型

| Proto 类型 | Java 类型 | 默认值 | 说明 |
|-----------|-----------|--------|------|
| `string` | String | "" | 字符串 |
| `int32` | int | 0 | 32位整数 |
| `int64` | long | 0 | 64位整数 |
| `float` | float | 0.0 | 单精度 |
| `double` | double | 0.0 | 双精度 |
| `bool` | boolean | false | 布尔 |
| `bytes` | ByteString | empty | 二进制 |
| `enum` | enum | 第一个值 | 枚举 |

### 枚举

```protobuf
enum Status {
    UNKNOWN = 0;     // 枚举第一个值必须是 0
    ACTIVE = 1;
    INACTIVE = 2;
}
```

### 嵌套消息

```protobuf
message SearchRequest {
    string query = 1;
    int32 page = 2;
    
    message Result {          // 嵌套消息
        string title = 1;
        string url = 2;
    }
    
    repeated Result results = 3;
}
```

### oneof（联合类型）

```protobuf
message Response {
    oneof result {            // 只能设置其中一个
        string data = 1;
        Error error = 2;
    }
}
```

### map 类型

```protobuf
message UserProfile {
    map<string, string> attributes = 1;  // key=string, value=string
    map<int32, string> id_names = 2;
}
```

### 保留字段

```protobuf
message Foo {
    reserved 2, 15, 9 to 11;      // 保留字段编号
    reserved "foo", "bar";         // 保留字段名
}
```

## 服务定义

```protobuf
service Greeter {
    // Unary: 一次请求一次响应
    rpc SayHello (HelloRequest) returns (HelloResponse);

    // Server Streaming: 一次请求多次响应
    rpc SayHelloServerStream (HelloRequest) returns (stream HelloResponse);

    // Client Streaming: 多次请求一次响应
    rpc SayHelloClientStream (stream HelloRequest) returns (HelloResponse);

    // Bidirectional Streaming: 多次请求多次响应
    rpc SayHelloBidiStream (stream HelloRequest) returns (stream HelloResponse);
}
```

## Proto3 注意事项

| Proto3 行为 | 说明 |
|------------|------|
| 默认值不序列化 | 零值字段不会被编码（减小体积） |
| 没有 required/optional | proto3 移除了这些关键字（3.15+ 重新引入 optional） |
| 枚举默认值 | 第一个值必须为 0 |
| 向后兼容 | 新增字段只需分配新编号，不破坏旧代码 |

## 编译与代码生成

### Maven 配置

```xml
<dependencies>
    <dependency>
        <groupId>io.grpc</groupId>
        <artifactId>grpc-protobuf</artifactId>
        <version>1.68.0</version>
    </dependency>
    <dependency>
        <groupId>io.grpc</groupId>
        <artifactId>grpc-stub</artifactId>
        <version>1.68.0</version>
    </dependency>
    <dependency>
        <groupId>javax.annotation</groupId>
        <artifactId>javax.annotation-api</artifactId>
        <version>1.3.2</version>
    </dependency>
</dependencies>

<build>
    <extensions>
        <extension>
            <groupId>kr.motd.maven</groupId>
            <artifactId>os-maven-plugin</artifactId>
            <version>1.7.1</version>
        </extension>
    </extensions>
    <plugins>
        <plugin>
            <groupId>org.xolstice.maven.plugins</groupId>
            <artifactId>protobuf-maven-plugin</artifactId>
            <version>0.6.1</version>
            <configuration>
                <protocArtifact>com.google.protobuf:protoc:3.25.3:exe:${os.detected.classifier}</protocArtifact>
                <pluginId>grpc-java</pluginId>
                <pluginArtifact>io.grpc:protoc-gen-grpc-java:1.68.0:exe:${os.detected.classifier}</pluginArtifact>
            </configuration>
            <executions>
                <execution>
                    <goals><goal>compile</goal><goal>compile-custom</goal></goals>
                </execution>
            </executions>
        </plugin>
    </plugins>
</build>
```

```bash
# 执行编译
mvn clean compile
# 生成的文件在 target/generated-sources/protobuf/
```

生成的文件类型：
- `HelloRequest.java` — 消息类
- `GreeterGrpc.java` — gRPC 服务基类（含 Stub 定义）

::: tip 字段编号
字段编号 1-15 用 1 字节编码，16-2047 用 2 字节。频繁使用的字段用编号 1-15。
:::
