import { defineConfig } from 'vitepress'

export default defineConfig({
  base: '/netty-docs/',
  lang: 'zh-CN',
  title: '后端技术学习指南',
  description: 'Netty + Kafka 从入门到精通 — 基础知识、核心原理、实战操作',
  head: [['link', { rel: 'icon', href: '/netty-docs/favicon.svg' }]],

  themeConfig: {
    logo: '/netty-docs/favicon.svg',
    search: {
      provider: 'local',
      options: {
        translations: {
          button: {
            buttonText: '搜索文档',
            buttonAriaLabel: '搜索文档',
          },
          modal: {
            noResultsText: '无法找到相关结果',
            resetButtonTitle: '清除查询条件',
            footer: {
              selectText: '选择',
              navigateText: '切换',
              closeText: '关闭',
            },
          },
        },
      },
    },

    nav: [
      {
        text: 'Netty 学习',
        items: [
          { text: '基础知识', link: '/netty/basics/' },
          { text: '源码分析', link: '/netty/source/' },
          { text: '实战操作', link: '/netty/practice/' },
        ],
      },
      {
        text: 'Kafka 学习',
        items: [
          { text: '基础知识', link: '/kafka/basics/' },
          { text: '核心原理', link: '/kafka/internals/' },
          { text: '实战操作', link: '/kafka/practice/' },
        ],
      },
      {
        text: '资源',
        items: [
          { text: 'Netty 官网', link: 'https://netty.io/' },
          { text: 'Netty GitHub', link: 'https://github.com/netty/netty' },
          { text: 'Kafka 官网', link: 'https://kafka.apache.org/' },
          { text: 'Kafka GitHub', link: 'https://github.com/apache/kafka' },
        ],
      },
    ],

    sidebar: {
      '/netty/basics/': [
        {
          text: 'Netty 基础知识',
          items: [
            { text: '概述', link: '/netty/basics/' },
            { text: 'Netty 简介', link: '/netty/basics/what-is-netty' },
            { text: 'BIO/NIO/AIO 模型', link: '/netty/basics/io-models' },
            { text: 'Reactor 线程模型', link: '/netty/basics/reactor-model' },
            { text: '核心组件', link: '/netty/basics/core-components' },
            { text: 'ByteBuf 缓冲区', link: '/netty/basics/bytebuf' },
            { text: '编解码器', link: '/netty/basics/codec' },
            { text: '粘包与拆包', link: '/netty/basics/sticky-unpack' },
          ],
        },
      ],
      '/netty/source/': [
        {
          text: 'Netty 源码分析',
          items: [
            { text: '概述', link: '/netty/source/' },
            { text: 'Bootstrap 启动流程', link: '/netty/source/bootstrap-analysis' },
            { text: 'EventLoop 线程模型', link: '/netty/source/eventloop-analysis' },
            { text: 'Channel 实现原理', link: '/netty/source/channel-analysis' },
            { text: 'Pipeline 责任链', link: '/netty/source/pipeline-analysis' },
            { text: '内存管理机制', link: '/netty/source/memory-analysis' },
          ],
        },
      ],
      '/netty/practice/': [
        {
          text: 'Netty 实战操作',
          items: [
            { text: '概述', link: '/netty/practice/' },
            { text: 'Echo 服务器', link: '/netty/practice/echo-server' },
            { text: '多人群聊系统', link: '/netty/practice/chat-room' },
            { text: 'HTTP 服务器', link: '/netty/practice/http-server' },
            { text: 'WebSocket 聊天', link: '/netty/practice/websocket-chat' },
            { text: '自定义协议', link: '/netty/practice/custom-protocol' },
          ],
        },
      ],
      '/kafka/basics/': [
        {
          text: 'Kafka 基础知识',
          items: [
            { text: '概述', link: '/kafka/basics/' },
            { text: 'Kafka 简介', link: '/kafka/basics/what-is-kafka' },
            { text: '整体架构', link: '/kafka/basics/architecture' },
            { text: 'Topic 与 Partition', link: '/kafka/basics/topic-partition' },
            { text: '生产者', link: '/kafka/basics/producer' },
            { text: '消费者', link: '/kafka/basics/consumer' },
          ],
        },
      ],
      '/kafka/internals/': [
        {
          text: 'Kafka 核心原理',
          items: [
            { text: '概述', link: '/kafka/internals/' },
            { text: '日志存储', link: '/kafka/internals/storage' },
            { text: '副本机制', link: '/kafka/internals/replication' },
            { text: 'Leader 选举与 ISR', link: '/kafka/internals/isr-leader-election' },
            { text: 'Coordinator 协调器', link: '/kafka/internals/coordinator' },
            { text: '幂等性与事务', link: '/kafka/internals/transaction' },
          ],
        },
      ],
      '/kafka/practice/': [
        {
          text: 'Kafka 实战操作',
          items: [
            { text: '概述', link: '/kafka/practice/' },
            { text: '快速入门', link: '/kafka/practice/quick-start' },
            { text: 'Spring Boot 生产者', link: '/kafka/practice/spring-kafka-producer' },
            { text: 'Spring Boot 消费者', link: '/kafka/practice/spring-kafka-consumer' },
            { text: '消息可靠性保障', link: '/kafka/practice/message-reliability' },
            { text: '性能调优', link: '/kafka/practice/performance-tuning' },
          ],
        },
      ],
    },

    outline: {
      level: [2, 3],
      label: '页面导航',
    },

    docFooter: {
      prev: '上一页',
      next: '下一页',
    },

    lastUpdated: {
      text: '最后更新',
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/zhukingliu/netty-docs' },
    ],

    footer: {
      message: '基于 VitePress 构建 | Netty + Kafka 学习笔记',
    },
  },

  markdown: {
    theme: {
      light: 'one-dark-pro',
      dark: 'one-dark-pro',
    },
    lineNumbers: true,
    config: (md) => {
      const defaultFence = md.renderer.rules.fence!
      md.renderer.rules.fence = (tokens, idx, options, env, self) => {
        const token = tokens[idx]
        if (token.info.trim() === 'mermaid') {
          const encoded = Buffer.from(token.content).toString('base64')
          return `<div class="mermaid" data-graph="${encoded}"></div>`
        }
        return defaultFence(tokens, idx, options, env, self)
      }
    },
  },
})
