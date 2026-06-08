# 服务端流式

服务端流式适合**客户端请求一次，服务端持续推送多条数据**的场景。

## Proto 定义

```protobuf
service LogService {
    // 客户端订阅，服务端持续推送日志
    rpc SubscribeLogs (LogSubscription) returns (stream LogEntry);
}

message LogSubscription {
    string level = 1;        // 日志级别过滤: INFO/WARN/ERROR
    repeated string services = 2;  // 订阅的服务名
}

message LogEntry {
    int64 timestamp = 1;
    string level = 2;
    string service = 3;
    string message = 4;
}
```

## 服务端实现

```java
public class LogServiceImpl extends LogServiceGrpc.LogServiceImplBase {

    @Override
    public void subscribeLogs(LogSubscription request,
                              StreamObserver<LogEntry> responseObserver) {
        String level = request.getLevel();
        List<String> services = request.getServicesList();

        // 模拟持续推送日志
        ScheduledExecutorService executor = Executors.newSingleThreadScheduledExecutor();

        executor.scheduleAtFixedRate(() -> {
            try {
                LogEntry entry = generateLogEntry(level, services);
                responseObserver.onNext(entry);  // 每次推送一条
            } catch (Exception e) {
                responseObserver.onError(e);      // 推送异常
            }
        }, 0, 2, TimeUnit.SECONDS);  // 每 2 秒推送一条

        // 注意: onCompleted() 什么情况下调用？
        // 可以设置定时关闭，或者由客户端取消时触发
    }

    private LogEntry generateLogEntry(String level, List<String> services) {
        Random random = new Random();
        return LogEntry.newBuilder()
            .setTimestamp(System.currentTimeMillis())
            .setLevel(level.isEmpty() ? "INFO" : level)
            .setService(services.isEmpty() ? "unknown" 
                : services.get(random.nextInt(services.size())))
            .setMessage("Log event at " + Instant.now())
            .build();
    }
}
```

## 客户端调用

```java
public class LogClient {

    public static void main(String[] args) throws InterruptedException {
        ManagedChannel channel = ManagedChannelBuilder
            .forAddress("localhost", 8080)
            .usePlaintext()
            .build();

        LogServiceGrpc.LogServiceStub asyncStub = LogServiceGrpc.newStub(channel);

        LogSubscription request = LogSubscription.newBuilder()
            .setLevel("ERROR")
            .addServices("order-service")
            .addServices("payment-service")
            .build();

        // 服务端流式 — 必须用异步 Stub
        asyncStub.subscribeLogs(request, new StreamObserver<LogEntry>() {
            @Override
            public void onNext(LogEntry entry) {
                // 服务端每推送一条，这里就收到一条
                System.out.printf("[%s] %s - %s: %s%n",
                    entry.getLevel(),
                    entry.getTimestamp(),
                    entry.getService(),
                    entry.getMessage());
            }

            @Override
            public void onError(Throwable t) {
                System.err.println("流异常: " + t.getMessage());
            }

            @Override
            public void onCompleted() {
                // 服务端主动结束流时调用
                System.out.println("日志订阅结束");
            }
        });

        // 让程序运行 30 秒后取消订阅
        Thread.sleep(30000);
        channel.shutdown();
    }
}
```

## 取消机制

```java
// 客户端可以通过 Context 取消流
Context.CancellableContext withCancellation = Context.current().withCancellation();

withCancellation.run(() -> {
    asyncStub.subscribeLogs(request, new StreamObserver<LogEntry>() {
        @Override
        public void onNext(LogEntry entry) { ... }
        // ...
    });
});

// 5 秒后取消
new Thread(() -> {
    try {
        Thread.sleep(5000);
        withCancellation.cancel(
            Status.CANCELLED.withDescription("客户端取消订阅").asRuntimeException());
    } catch (InterruptedException e) {
        Thread.currentThread().interrupt();
    }
}).start();
```

## 服务端感知取消

```java
@Override
public void subscribeLogs(LogSubscription request,
                          StreamObserver<LogEntry> responseObserver) {
    // 检查 Context 是否已被取消
    while (!Context.current().isCancelled()) {
        LogEntry entry = generateLogEntry(...);
        responseObserver.onNext(entry);

        try {
            Thread.sleep(2000);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            break;
        }
    }

    if (Context.current().isCancelled()) {
        System.out.println("客户端取消了订阅");
    }
    responseObserver.onCompleted();
}
```

## 适用场景

| 场景 | 示例 |
|------|------|
| 实时数据推送 | 股票行情、体育比分 |
| 日志/事件订阅 | 日志聚合、告警通知 |
| 大数据导出 | 数据库全量导出（分页流式推送） |
| 进度更新 | 长任务进度实时反馈 |

::: tip
服务端流式的核心区别：方法签名中 `returns` 用 `stream` 关键字，客户端必须用**异步 Stub** 接收。
:::
