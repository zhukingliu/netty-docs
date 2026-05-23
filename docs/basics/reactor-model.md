# Reactor 线程模型

## 什么是 Reactor 模型

Reactor 模型是一种**基于事件驱动的并发编程模型**，核心思想是：

- 将 IO 请求分发给一个或多个 **Reactor 线程**
- Reactor 线程负责监听、分发事件给对应的 **Handler** 处理

```mermaid
flowchart LR
    A[IO 请求] --> B[Reactor<br/>事件分发器]
    B --> C[Handler-A<br/>处理读]
    B --> D[Handler-B<br/>处理写]
    B --> E[Handler-C<br/>处理连接]
```

## 三种 Reactor 模型

### 1. 单 Reactor 单线程

```mermaid
flowchart LR
    subgraph "单 Reactor 单线程"
        R[Reactor<br/>acceptor + handler] --> C1[Handler]
        R --> C2[Handler]
        R --> C3[Handler]
    end
```

**特点**：一个 NIO 线程完成所有操作（accept、read、decode、process、encode、send）

| 优点 | 缺点 |
|------|------|
| 简单，无多线程开销 | 无法利用多核 CPU |
| | 一个 handler 阻塞会影响全部连接 |

### 2. 单 Reactor 多线程

```mermaid
flowchart LR
    R[Reactor<br/>acceptor + dispatch] --> T1[Handler-1]
    R --> T2[Handler-2]
    T1 --> P[Thread Pool<br/>业务处理]
    T2 --> P
```

**特点**：业务处理交给线程池，Reactor 线程只负责分发

::: warning 缺陷
Reactor 线程承担所有事件的监听和响应（accept、read、send），在百万连接场景下可能成为瓶颈。
:::

### 3. 主从 Reactor 多线程

```mermaid
flowchart LR
    subgraph "Main Reactor"
        M[MainReactor<br/>accept]
    end
    M --> S1[SubReactor-1<br/>read/dispatch/send]
    M --> S2[SubReactor-2<br/>read/dispatch/send]
    S1 --> P[Thread Pool]
    S2 --> P
```

**最佳模型！Netty 采用此模型：**

- **Main Reactor**（Boss Group）：处理客户端连接请求
- **Sub Reactor**（Worker Group）：处理已建立连接的 IO 读写
- **Thread Pool**：处理耗时业务逻辑

## Netty 中的 Reactor 实现

```java
// Netty 主从 Reactor 模型配置
EventLoopGroup bossGroup = new NioEventLoopGroup(1);     // Main Reactor
EventLoopGroup workerGroup = new NioEventLoopGroup();    // Sub Reactor（默认CPU核数×2）

ServerBootstrap bootstrap = new ServerBootstrap();
bootstrap.group(bossGroup, workerGroup)
         .channel(NioServerSocketChannel.class)
         .childHandler(new ChannelInitializer<SocketChannel>() {
             @Override
             protected void initChannel(SocketChannel ch) {
                 ch.pipeline().addLast(new MyHandler());  // Handler
             }
         });

ChannelFuture future = bootstrap.bind(8080).sync();
```

```mermaid
sequenceDiagram
    participant Client as 客户端
    participant Boss as Boss Group<br/>(Main Reactor)
    participant Worker as Worker Group<br/>(Sub Reactor)
    participant Handler as 业务 Handler

    Client->>Boss: 1. 发起连接请求
    Boss->>Worker: 2. 注册到 Worker EventLoop
    Worker-->>Client: 3. 连接建立成功
    Client->>Worker: 4. 发送数据
    Worker->>Handler: 5. 触发 channelRead
    Handler->>Handler: 6. 业务处理
    Handler->>Worker: 7. 写入响应
    Worker-->>Client: 8. 返回数据
```

## 配置建议

| 场景 | Boss Group 线程数 | Worker Group 线程数 |
|------|-------------------|---------------------|
| 一般并发 | 1 | CPU 核数 × 2 |
| 高并发短连接 | 1 | CPU 核数 × 2 |
| 长连接 + 低流量 | 1 | CPU 核数 |
| 海量连接 | 2~4 | CPU 核数 × 2 |

::: tip
EventLoopGroup 默认线程数是 `CPU核数 × 2`，通过 `io.netty.eventLoopThreads` 系统属性或构造函数参数可以自定义。
:::
