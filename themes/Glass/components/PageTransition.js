/**
 * 路由切换过渡 + 顶部进度条
 *
 * 在 <body> 上打 data-glass-route 状态（leaving / entering），由 style.js 里的
 * CSS 负责实际动效：
 *   leaving  → 内容淡出 + 顶部扫过一道进度光带
 *   entering → 新内容错落上浮入场
 *
 * 为什么不直接给 #container-inner 加 transform：
 *   祖先一旦有 transform 就会成为 fixed 后代的包含块，主题里若干 fixed 元素
 *   （目录抽屉、悬浮按钮）会被带偏；所以位移只加在卡片这一级。
 */
import { useEffect } from 'react'
import { useRouter } from 'next/router'

const ENTER_MS = 520

export default function PageTransition() {
  const router = useRouter()

  useEffect(() => {
    if (typeof document === 'undefined') return
    const body = document.body
    let timer = 0

    const set = v => {
      if (v) body.setAttribute('data-glass-route', v)
      else body.removeAttribute('data-glass-route')
    }

    const onStart = () => {
      clearTimeout(timer)
      set('leaving')
    }
    const onDone = () => {
      clearTimeout(timer)
      set('entering')
      timer = setTimeout(() => set(null), ENTER_MS)
    }

    router.events.on('routeChangeStart', onStart)
    router.events.on('routeChangeComplete', onDone)
    router.events.on('routeChangeError', onDone)
    return () => {
      clearTimeout(timer)
      router.events.off('routeChangeStart', onStart)
      router.events.off('routeChangeComplete', onDone)
      router.events.off('routeChangeError', onDone)
      set(null)
    }
  }, [router])

  return (
    <div className='glass-route-progress' aria-hidden='true'>
      <span />
    </div>
  )
}
