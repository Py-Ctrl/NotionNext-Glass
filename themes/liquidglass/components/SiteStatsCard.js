import { siteConfig } from '@/lib/config'
import { useGlobal } from '@/lib/global'
import SmartLink from '@/components/SmartLink'

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
function LatestPostsCard ({ latestPosts, allPosts }) {
  const { locale } = useGlobal()
  const recentPosts = (latestPosts || allPosts || []).slice(0, 5)

  if (recentPosts.length === 0) return null

  return (
    <div className='glass-card p-4 mb-4'>
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
 * 站点统计卡片：文章数、建站天数、访问量、访客数
 */
function SiteStatsCardInner ({ postCount, allPosts, categoryOptions, posts }) {
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
  // 5. 最后用 latestPosts 长度（不准确，只作为兜底）
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

  return (
    <div className='glass-card p-4'>
      <h3 className='text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3'>
        <i className='mr-1.5 fas fa-chart-bar' />
        站点统计
      </h3>
      <div className='grid grid-cols-2 gap-2 text-xs'>
        {/* 文章数 */}
        <div className='bg-white/40 dark:bg-white/5 rounded-lg p-2.5 text-center'>
          <div className='text-lg font-semibold text-indigo-500 dark:text-indigo-400'>
            {count}
          </div>
          <div className='text-gray-500 dark:text-gray-400 mt-0.5'>
            <i className='fas fa-file-alt mr-1' />
            文章数
          </div>
        </div>

        {/* 建站天数 */}
        <div className='bg-white/40 dark:bg-white/5 rounded-lg p-2.5 text-center'>
          <div className='text-lg font-semibold text-indigo-500 dark:text-indigo-400'>
            {siteDays}
          </div>
          <div className='text-gray-500 dark:text-gray-400 mt-0.5'>
            <i className='fas fa-calendar-day mr-1' />
            建站天数
          </div>
        </div>

        {/* 访问量 */}
        <div className='bg-white/40 dark:bg-white/5 rounded-lg p-2.5 text-center busuanzi_container_site_pv'>
          <div className='text-lg font-semibold text-indigo-500 dark:text-indigo-400'>
            <span className='busuanzi_value_site_pv'>--</span>
          </div>
          <div className='text-gray-500 dark:text-gray-400 mt-0.5'>
            <i className='fas fa-eye mr-1' />
            访问量
          </div>
        </div>

        {/* 访客数 */}
        <div className='bg-white/40 dark:bg-white/5 rounded-lg p-2.5 text-center busuanzi_container_site_uv'>
          <div className='text-lg font-semibold text-indigo-500 dark:text-indigo-400'>
            <span className='busuanzi_value_site_uv'>--</span>
          </div>
          <div className='text-gray-500 dark:text-gray-400 mt-0.5'>
            <i className='fas fa-users mr-1' />
            访客数
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * 站点统计：最新发布 + 统计数据（两个独立卡片）
 */
export default function SiteStatsCard (props) {
  const { latestPosts, allPosts, postCount, categoryOptions, posts } = props
  return (
    <section className='mb-5'>
      <LatestPostsCard latestPosts={latestPosts} allPosts={allPosts} />
      <SiteStatsCardInner
        postCount={postCount}
        allPosts={allPosts}
        categoryOptions={categoryOptions}
        posts={posts}
      />
    </section>
  )
}
