import BlogPostListEmpty from './BlogPostListEmpty'
import PaginationNumber from './PaginationNumber'
import LiquidGlassScrollContainer from './LiquidGlassScrollContainer'
import { useGlobal } from '@/lib/global'
import { useMemo } from 'react'

const BlogPostListPage = ({ posts = [], page, showSummary, siteInfo }) => {
  const { locale } = useGlobal()

  const scrollItems = useMemo(() => {
    if (!posts || posts.length === 0) return []
    return posts.map(post => ({
      title: post.title,
      subtitle: [post.date?.start_date, post.category, post.summary].filter(Boolean).join(' · ').slice(0, 120),
      link: {
        text: locale.COMMON?.ARTICLE_DETAIL || '阅读更多',
        href: post.href
      }
    }))
  }, [posts, locale])

  if (!posts || posts.length === 0) {
    return <BlogPostListEmpty />
  }

  return (
    <div className='w-full'>
      <div style={{ borderRadius: '24px', overflow: 'hidden' }}>
        <LiquidGlassScrollContainer items={scrollItems} height='600px' />
      </div>
      <div className='mt-6'>
        <PaginationNumber page={page} />
      </div>
    </div>
  )
}

export default BlogPostListPage
