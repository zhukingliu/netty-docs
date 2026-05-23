import { defineConfig } from 'vitepress'

export default defineConfig({
  base: '/netty-docs/',
  lang: 'zh-CN',
  title: 'Netty 学习指南',
  description: 'Netty 框架从入门到精通 — 基础知识、源码分析、实战操作',
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
      { text: '基础知识', link: '/basics/' },
      { text: '源码分析', link: '/source/' },
      { text: '实战操作', link: '/practice/' },
      {
        text: '资源',
        items: [
          { text: 'Netty 官网', link: 'https://netty.io/' },
          { text: 'GitHub 仓库', link: 'https://github.com/netty/netty' },
        ],
      },
    ],

    sidebar: {
      '/basics/': [
        {
          text: '基础知识',
          items: [
            { text: '概述', link: '/basics/' },
            { text: 'Netty 简介', link: '/basics/what-is-netty' },
            { text: 'BIO/NIO/AIO 模型', link: '/basics/io-models' },
            { text: 'Reactor 线程模型', link: '/basics/reactor-model' },
            { text: '核心组件', link: '/basics/core-components' },
            { text: 'ByteBuf 缓冲区', link: '/basics/bytebuf' },
            { text: '编解码器', link: '/basics/codec' },
            { text: '粘包与拆包', link: '/basics/sticky-unpack' },
          ],
        },
      ],
      '/source/': [
        {
          text: '源码分析',
          items: [
            { text: '概述', link: '/source/' },
            { text: 'Bootstrap 启动流程', link: '/source/bootstrap-analysis' },
            { text: 'EventLoop 线程模型', link: '/source/eventloop-analysis' },
            { text: 'Channel 实现原理', link: '/source/channel-analysis' },
            { text: 'Pipeline 责任链', link: '/source/pipeline-analysis' },
            { text: '内存管理机制', link: '/source/memory-analysis' },
          ],
        },
      ],
      '/practice/': [
        {
          text: '实战操作',
          items: [
            { text: '概述', link: '/practice/' },
            { text: 'Echo 服务器', link: '/practice/echo-server' },
            { text: '多人群聊系统', link: '/practice/chat-room' },
            { text: 'HTTP 服务器', link: '/practice/http-server' },
            { text: 'WebSocket 聊天', link: '/practice/websocket-chat' },
            { text: '自定义协议', link: '/practice/custom-protocol' },
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
      { icon: 'github', link: 'https://github.com/netty/netty' },
    ],

    footer: {
      message: '基于 VitePress 构建 | Netty 学习笔记',
    },
  },

  markdown: {
    theme: {
      light: 'one-dark-pro',
      dark: 'one-dark-pro',
    },
    lineNumbers: true,
  },
})
