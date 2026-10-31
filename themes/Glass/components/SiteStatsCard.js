import { siteConfig } from '@/lib/config'
import { useGlobal } from '@/lib/global'
import busuanzi from '@/lib/plugins/busuanzi'
import { useEffect, useState } from 'react'

/**
 * 解析建站时间：支持年份数字（2021）或日期字符串
 */
function parseSinceDate (since) {
  if (!since) return null
  // 如果是数字，当作年份处理
  if (typeof since === 'number') {
    return new Date(since, 0, 1) // 该年1月1日
  }
  // 如果是字符串且只有4位数字，当作年份
  if (typeof since === 'string' && /^\d{4}$/.test(since)) {
    return new Date(parseInt(since, 10), 0, 1)
  }
  // 否则尝试直接解析
  const d = new Date(since)
  return isNaN(d.getTime()) ? null : d
}

/**
 * 站点统计（文字版）：文章数、建站天数、访问量、访客数
 * 纯文字一行，不做卡片方框，直接放在顶部悬浮栏
 *
 * compact：去掉「站点统计」标题、整体缩小一级字号，
 * 给顶部悬浮栏这种横向空间紧张的容器用（页脚那种宽松排版不用开）
 */
export function SiteStatsText ({ postCount, allPosts, categoryOptions, posts, compact = false }) {
  const { NOTION_CONFIG } = useGlobal()
  // 不蒜子开关与数据（与 ExternalPlugins 里的判定保持一致）
  const busuanziEnabled = siteConfig('ANALYTICS_BUSUANZI_ENABLE', null, NOTION_CONFIG)
  const [busuanziData, setBusuanziData] = useState(null)
  useEffect(() => busuanzi.subscribe(setBusuanziData), [])
  // 建站天数
  const since = siteConfig('SINCE')
  const sinceDate = parseSinceDate(since)
  const siteDays = sinceDate
    ? Math.max(0, Math.ceil((new Date().getTime() - sinceDate.getTime()) / (1000 * 60 * 60 * 24)))
    : 0

  // 文章数：多级兜底
  // 1. 优先用 postCount（NotionNext 内置）
  // 2. 用 categoryOptions 中所有分类的文章数之和（一篇文章可能属于多个分类，可能偏大）
  // 3. 用首页的 posts 数组长度
  // 4. 用 allPosts 数组长度
  let count = postCount
  if (!count || count <= 1) {
    const categorySum = (categoryOptions || []).reduce((sum, c) => sum + (c.count || 0), 0)
    if (categorySum > 0) {
      count = categorySum
    } else if (posts && posts.length > 0) {
      count = posts.length
    } else if (allPosts && allPosts.length > 0) {
      count = allPosts.length
    }
  }
  count = count || 0

  const items = [
    { icon: 'fa-file-alt', label: '文章数', value: count },
    { icon: 'fa-calendar-day', label: '建站天数', value: siteDays },
    busuanziEnabled && { icon: 'fa-eye', label: '访问量', value: busuanziData?.site_pv ?? '--' },
    busuanziEnabled && { icon: 'fa-users', label: '访客数', value: busuanziData?.site_uv ?? '--' }
  ].filter(Boolean)

  return (
    <div
      className={`flex flex-wrap items-center justify-center ${compact ? 'gap-x-4 gap-y-1 text-[0.6875rem]' : 'gap-x-5 gap-y-1.5 text-xs'}`}>
      {/* 玻璃面铺在壁纸上，底色不可控 —— 文字必须给足对比度，
          之前用 text-gray-500 + opacity-70 直接糊进背景里了 */}
      {!compact && (
        <span className='inline-flex items-center gap-1.5 font-semibold text-gray-900 dark:text-white'>
          <i className='fas fa-chart-bar text-[0.625rem]' />
          站点统计
        </span>
      )}
      {items.map(it => (
        <span key={it.label} className='inline-flex items-center gap-1.5 whitespace-nowrap'>
          <i className={`fas ${it.icon} text-[0.625rem]`} />
          <span className='font-medium text-gray-700 dark:text-gray-200'>{it.label}</span>
          <span className='font-semibold tabular-nums text-gray-900 dark:text-white'>{it.value}</span>
        </span>
      ))}
    </div>
  )
}
