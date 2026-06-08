# gRPC 快速入门

## Hello World 完整示例

### 1. 编写 proto 文件

```protobuf
// src/main/proto/greeter.proto
syntax = "proto3";

option java_package = "com.example.grpc";
option java_multiple_files = true;

package greeter;

service Greeter {
    rpc SayHello (HelloRequest) returns (HelloResponse);
}

message HelloRequest {
    string name = 1;
}

message HelloResponse {
    string message = 1;
}
```

### 2. 服务端实现

```java
public class HelloWorldServer {
    private Server server;

    public static void main(String[] args) throws Exception {
        new HelloWorldServer().start();
    }

    public void start() throws IOException, InterruptedException {
        server = ServerBuilder
            .forPort(8080)
            .addService(new GreeterImpl())
            .build()
            .start();

        System.out.println("gRPC 服务启动: localhost:8080");
        server.awaitTermination();
    }

    static class GreeterImpl extends GreeterGrpc.GreeterImplBase {
        @Override
        public void sayHello(HelloRequest request,
                             StreamObserver<HelloResponse> responseObserver) {
            String name = request.getName();
            
            HelloResponse reply = HelloResponse.newBuilder()
                .setMessage("Hello " + name + "!")
                .build();

            responseObserver.onNext(reply);
            responseObserver.onCompleted();
        }
    }
}
```

### 3. 客户端实现

```java
public class HelloWorldClient {
    private final GreeterGrpc.GreeterBlockingStub blockingStub;

    public HelloWorldClient(ManagedChannel channel) {
        this.blockingStub = GreeterGrpc.newBlockingStub(channel);
    }

    public void greet(String name) {
        HelloRequest request = HelloRequest.newBuilder()
            .setName(name)
            .build();

        HelloResponse response = blockingStub.sayHello(request);
        System.out.println("响应: " + response.getMessage());
    }

    public static void main(String[] args) {
        ManagedChannel channel = ManagedChannelBuilder
            .forAddress("localhost", 8080)
            .usePlaintext()
            .build();

        try {
            HelloWorldClient client = new HelloWorldClient(channel);
            client.greet("World");
            client.greet("gRPC");
        } finally {
            channel.shutdown();
        }
    }
}
```

### 4. 运行

```bash
# 终端1: 启动服务端
mvn exec:java -Dexec.mainClass="com.example.HelloWorldServer"
# 输出: gRPC 服务启动: localhost:8080

# 终端2: 运行客户端
mvn exec:java -Dexec.mainClass="com.example.HelloWorldClient"
# 输出:
# 响应: Hello World!
# 响应: Hello gRPC!
```

## 代码生成的文件

编译 proto 后生成的关键类：

```
target/generated-sources/protobuf/
├── greeter/
│   ├── GreeterGrpc.java           ← 服务端基类 + 客户端 Stub
│   ├── HelloRequest.java          ← 请求消息
│   ├── HelloResponse.java         ← 响应消息
│   └── HelloRequestOrBuilder.java ← Builder 接口
```

## 带 Context 的示例

```java
static class GreeterImpl extends GreeterGrpc.GreeterImplBase {
    @Override
    public void sayHello(HelloRequest request,
                         StreamObserver<HelloResponse> responseObserver) {
        // 获取客户端 IP
        String clientIp = Constants.CLIENT_IP_CONTEXT_KEY.get();
        System.out.println("来自 " + clientIp + " 的请求");

        HelloResponse reply = HelloResponse.newBuilder()
            .setMessage("Hello " + request.getName())
            .build();

        responseObserver.onNext(reply);
        responseObserver.onCompleted();
    }
}
```

::: tip
`usePlaintext()` 仅供开发测试。生产环境必须使用 TLS。
:::
