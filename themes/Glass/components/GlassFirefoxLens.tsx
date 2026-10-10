/**
 * Firefox 折射适配层
 *
 * ## 作用
 * 主题的玻璃折射走 `backdrop-filter: url(#f)`，**Firefox 不支持** —— 所以在 Firefox 上
 * 所有玻璃面都没有折射。这个组件只在 Firefox 里激活，给主题的各个玻璃面挂上
 * `SvgBackdropLens`（把壁纸复制进 SVG 再 `feDisplacementMap`），补齐折射。
 *
 * ## 为什么用「注入」而不是逐个改组件
 * 玻璃面散落在 `.glass-card` / `.glass-post-item` / `.glass-sidebar` / `.glass-footer` /
 * `.glass-nav` 等多个组件里，逐个改造要动很多文件、回归面很大。
 * 这里是**渐进增强**：只在 Firefox 里、只往这些元素里塞一层绝对定位的 SVG，
 * 其它浏览器完全不受影响，也不改变任何现有组件的结构。
 *
 * ## 配套 CSS（见 style.js）
 * `.glass-ff-lens` 把宿主元素的 `background` 让出来（改透明），
 * 否则宿主自己的 `--glass-bg` 会盖住注入的 SVG。
 */
import { useEffect } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import SvgBackdropLens from './SvgBackdropLens'

/** 需要补折射的玻璃面 */
const TARGET_SELECTOR = [
  '.glass-card',
  '.glass-post-item',
  '.glass-sidebar',
  '.glass-footer',
  '.glass-nav',
  '.algolia-glass-card'
].join(',')

const HOST_CLASS = 'glass-ff-lens'

export default function GlassFirefoxLens () {
  useEffect(() => {
    if (typeof window === 'undefined') return
    // 只在 Firefox 里启用：Chromium 有自己的 backdrop-filter 路径
    if (!/Firefox\//.test(navigator.userAgent)) return
    // 尊重减少动画偏好：折射属于装饰性效果，直接不做
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return

    const roots = new Map<Element, Root>()

    const sync = () => {
      const root = document.getElementById('theme-glass')
      if (!root) return

      // 新增：给还没有注入过的玻璃面挂上折射层
      root.querySelectorAll(TARGET_SELECTOR).forEach(el => {
        if (roots.has(el)) return
        const r = el.getBoundingClientRect()
        if (r.width < 24 || r.height < 24) return

        el.classList.add(HOST_CLASS)
        const holder = document.createElement('div')
        holder.className = 'glass-ff-lens-layer'
        el.insertBefore(holder, el.firstChild)

        const reactRoot = createRoot(holder)
        roots.set(el, reactRoot)
        reactRoot.render(
          <SvgBackdropLens
            width={Math.round(r.width)}
            height={Math.round(r.height)}
            radius={16}
          />
        )
      })

      // 移除：已经不在文档里的（路由切换后卸载）
      roots.forEach((reactRoot, el) => {
        if (!document.contains(el)) {
          reactRoot.unmount()
          roots.delete(el)
        }
      })
    }

    sync()

    // 路由切换 / 内容变化后补挂（主题是 SPA，DOM 会持续变化）
    const mo = new MutationObserver(() => requestAnimationFrame(sync))
    mo.observe(document.body, { childList: true, subtree: true })

    let resizeTimer = 0
    const onResize = () => {
      window.clearTimeout(resizeTimer)
      resizeTimer = window.setTimeout(sync, 200)
    }
    window.addEventListener('resize', onResize, { passive: true })

    return () => {
      mo.disconnect()
      window.removeEventListener('resize', onResize)
      window.clearTimeout(resizeTimer)
      roots.forEach(reactRoot => reactRoot.unmount())
      roots.clear()
    }
  }, [])

  return null
}
