import DefaultTheme from 'vitepress/theme'
import { watch, nextTick, onMounted } from 'vue'
import { useRoute } from 'vitepress'
import mermaid from 'mermaid'
import './style.css'

// 初始化 mermaid 配置
mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  securityLevel: 'loose',
  themeVariables: {
    primaryColor: '#1f6feb',
    primaryTextColor: '#e6edf3',
    primaryBorderColor: '#30363d',
    lineColor: '#58a6ff',
    secondaryColor: '#161b22',
    tertiaryColor: '#0d1117',
  },
})

export default {
  extends: DefaultTheme,
  setup() {
    const route = useRoute()

    // 渲染 mermaid 图表
    const renderMermaid = async () => {
      await nextTick()
      const elements = document.querySelectorAll('.mermaid')
      for (const el of elements) {
        const id = 'mermaid-' + Math.random().toString(36).substring(7)
        el.id = id
        // 跳过已渲染的
        if (el.getAttribute('data-processed')) continue
        el.setAttribute('data-processed', 'true')
        try {
          const code = el.textContent || ''
          const { svg } = await mermaid.render(id + '-svg', code)
          el.innerHTML = svg
        } catch (e) {
          el.innerHTML = `<pre style="color:#f85149">Mermaid 渲染错误: ${(e as Error).message}</pre>`
        }
      }
    }

    // 初次加载渲染
    onMounted(() => {
      renderMermaid()
    })

    // 路由切换时重新渲染
    watch(() => route.path, () => {
      setTimeout(renderMermaid, 100)
    })
  },
}
