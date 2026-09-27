import busuanzi from '@/lib/plugins/busuanzi'
import { useGlobal } from '@/lib/global'
import { useEffect } from 'react'

/**
 * 不蒜子统计
 * 仅在首次加载和主题切换时获取数据，避免 SPA 路由切换导致 site_pv 虚高
 */
export default function Busuanzi () {
  const { theme } = useGlobal()

  // 只在主题确定/切换时获取一次。theme 初始值即来自 blog.config（非空），
  // 因此首屏只发一次请求；再挂一个 [] 的 effect 会让 site_pv 一次访问记两次。
  useEffect(() => {
    if (theme) {
      busuanzi.fetch()
    }
  }, [theme])

  return null
}
