import { siteConfig } from '@/lib/config'
import { useGlobal } from '@/lib/global'
import SmartLink from '@/components/SmartLink'

/**
 * 站点统计卡片：最新发布、文章数、建站天数、访问量、访客数
 */
export default function SiteStatsCard ({ latestPosts, allPosts }) {
  const { locale } = useGlobal()

  // 建站天数
  const since = siteConfig('SINCE')
  let siteDays = 0
  if (since) {
    const sinceDate = new Date(since)
    const today = new Date()
    const diffTime = today.getTime() - sinceDate.getTime()
    siteDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)))
  }

  // 文章数
  const postCount = allPosts?.length || 0

  // 最新文章（取前5篇）
  const recentPosts = (latestPosts || allPosts || []).slice(0, 5)

  return (
    <section className='mb-5'>
      {/* 最新发布 */}
      <div className='flex items-center justify-between mb-3'>
        <h3 className='text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider'>
          <i className='mr-1.5 fas fa-history' />
          {locale.COMMON.LATEST_POSTS || '最新发布'}
        </h3>
      </div>

      {recentPosts.length > 0 && (
        <div className='space-y-2 mb-4'>
          {recentPosts.map(post => (
            <SmartLink
              key={post.id}
              href={post?.href}
              className='block group'
            >
              <div className='flex items-start gap-2 text-sm'>
                <span className='text-indigo-400 dark:text-indigo-500 mt-0.5 text-xs'>
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
      )}

      {/* 统计数据 */}
      <div className='grid grid-cols-2 gap-2 text-xs'>
        {/* 文章数 */}
        <div className='glass-card p-2.5 text-center'>
          <div className='text-lg font-semibold text-indigo-500 dark:text-indigo-400'>
            {postCount}
          </div>
          <div className='text-gray-500 dark:text-gray-400 mt-0.5'>
            <i className='fas fa-file-alt mr-1' />
            文章数
          </div>
        </div>

        {/* 建站天数 */}
        <div className='glass-card p-2.5 text-center'>
          <div className='text-lg font-semibold text-indigo-500 dark:text-indigo-400'>
            {siteDays}
          </div>
          <div className='text-gray-500 dark:text-gray-400 mt-0.5'>
            <i className='fas fa-calendar-day mr-1' />
            建站天数
          </div>
        </div>

        {/* 访问量 */}
        <div className='glass-card p-2.5 text-center busuanzi_container_site_pv'>
          <div className='text-lg font-semibold text-indigo-500 dark:text-indigo-400'>
            <span className='busuanzi_value_site_pv'>--</span>
          </div>
          <div className='text-gray-500 dark:text-gray-400 mt-0.5'>
            <i className='fas fa-eye mr-1' />
            访问量
          </div>
        </div>

        {/* 访客数 */}
        <div className='glass-card p-2.5 text-center busuanzi_container_site_uv'>
          <div className='text-lg font-semibold text-indigo-500 dark:text-indigo-400'>
            <span className='busuanzi_value_site_uv'>--</span>
          </div>
          <div className='text-gray-500 dark:text-gray-400 mt-0.5'>
            <i className='fas fa-users mr-1' />
            访客数
          </div>
        </div>
      </div>
    </section>
  )
}
