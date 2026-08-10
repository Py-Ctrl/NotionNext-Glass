import { useGlobal } from '@/lib/global'
import { useMemo } from 'react'
import LiquidGlassScrollContainer from './LiquidGlassScrollContainer'

const RecommendPosts = ({ recommendPosts }) => {
  const { locale } = useGlobal()

  const items = useMemo(() => {
    if (!recommendPosts || recommendPosts.length === 0) return []
    return recommendPosts.slice(0, 6).map(post => ({
      title: post.title,
      subtitle: [post.date?.start_date, post.category].filter(Boolean).join(' · '),
      link: {
        text: locale.COMMON?.ARTICLE_DETAIL || '阅读更多',
        href: post.href
      }
    }))
  }, [recommendPosts, locale])

  if (!recommendPosts || recommendPosts.length === 0) return null

  return (
    <div className='mt-8'>
      <h3 className='text-sm font-medium text-gray-500 dark:text-gray-400 mb-4'>
        <i className='fas fa-thumbs-up mr-2 text-indigo-400' />
        推荐阅读
      </h3>
      <div style={{ borderRadius: '20px', overflow: 'hidden' }}>
        <LiquidGlassScrollContainer items={items} height='400px' />
      </div>
    </div>
  )
}

export default RecommendPosts
