import { siteConfig } from '@/lib/config'
import { useGlobal } from '@/lib/global'
import SmartLink from '@/components/SmartLink'
import busuanzi from '@/lib/plugins/busuanzi'
import { useEffect, useState } from 'react'
import { useLensBackdrop } from './useLensBackdrop'

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
 * 最新发布卡片
 */
export function LatestPostsCard ({ latestPosts, allPosts }) {
  const { locale } = useGlobal()
  // "最新发布"卡片：SVG 透镜折射（refractionHeight 16 / mag 32 / 无模糊 / saturate 1.5）
  const lens = useLensBackdrop({ refractionHeight: 16, maxMag: 32, blur: 0, saturate: 1.5 })
  const recentPosts = (latestPosts || allPosts || []).slice(0, 5)

  if (recentPosts.length === 0) return null

  return (
    <div ref={lens.elRef} className='glass-card p-4 mb-4' style={lens.style || undefined}>
      {lens.filterNode}
      <h3 className='text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3'>
        <i className='mr-1.5 fas fa-history' />
        {locale.COMMON.LATEST_POSTS || '最新发布'}
      </h3>
      <div className='space-y-2'>
        {recentPosts.map(post => (
          <SmartLink
            key={post.id}
            href={post?.href}
            className='block group'
          >
            <div className='flex items-start gap-2 text-sm'>
              <span className='text-indigo-400 dark:text-indigo-500 mt-0.5 text-xs flex-shrink-0'>
                <i className='fas fa-angle-right' />
              </span>
              <div className='flex-1 min-w-0'>
                <div className='line-clamp-1 text-gray-700 dark:text-gray-300 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors'>
                  {post.title}
                </div>
                <div className='text-xs text-gray-400 dark:text-gray-500 mt-0.5'>
                  {post.lastEditedDay || post.date?.start_date || ''}
                </div>
              </div>
            </div>
          </SmartLink>
        ))}
      </div>
    </div>
  )
}

/**
 * 站点统计（文字版）：文章数、建站天数、访问量、访客数
 * 纯文字一行，不做卡片方框，直接放在页脚
 */
export function SiteStatsText ({ postCount, allPosts, categoryOptions, posts }) {
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
    <div className='flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 text-xs text-gray-500 dark:text-gray-400'>
      {items.map(it => (
        <span key={it.label} className='inline-flex items-center gap-1.5 whitespace-nowrap'>
          <i className={`fas ${it.icon} text-[10px] opacity-60`} />
          <span className='opacity-70'>{it.label}</span>
          <span className='font-semibold tabular-nums text-gray-700 dark:text-gray-200'>{it.value}</span>
        </span>
      ))}
    </div>
  )
}

/**
 * 兼容用的默认导出：最新发布卡片 + 文字版统计
 */
export default function SiteStatsCard (props) {
  const { latestPosts, allPosts, postCount, categoryOptions, posts } = props
  return (
    <section className='mb-5'>
      <LatestPostsCard latestPosts={latestPosts} allPosts={allPosts} />
      <SiteStatsText
        postCount={postCount}
        allPosts={allPosts}
        categoryOptions={categoryOptions}
        posts={posts}
      />
    </section>
  )
}
