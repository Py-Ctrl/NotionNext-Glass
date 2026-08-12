import busuanzi from '@/lib/plugins/busuanzi'
import { useGlobal } from '@/lib/global'
import { useEffect } from 'react'

/**
 * 不蒜子统计
 * 仅在首次加载和主题切换时获取数据，避免 SPA 路由切换导致 site_pv 虚高
 */
export default function Busuanzi () {
  const { theme } = useGlobal()

  // 首次加载时获取一次统计数据
  useEffect(() => {
    busuanzi.fetch()
  }, [])

  // 更换主题时重新获取（主题切换不频繁，可接受）
  useEffect(() => {
    if (theme) {
      busuanzi.fetch()
    }
  }, [theme])

  return null
}
