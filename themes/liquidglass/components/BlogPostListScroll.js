import { useGlobal } from '@/lib/global'
import { useRouter } from 'next/router'
import { useEffect, useState, useMemo } from 'react'
import BlogPostListEmpty from './BlogPostListEmpty'
import LiquidGlassButton from './LiquidGlassButton'
import LiquidGlassScrollContainer from './LiquidGlassScrollContainer'

const BlogPostListScroll = ({ posts = [], showSummary, siteInfo }) => {
  const { locale } = useGlobal()
  const router = useRouter()
  const [currentPage, setCurrentPage] = useState(1)
  const [showLoadMore, setShowLoadMore] = useState(true)
  const pageSize = 6

  const postsToShow = posts.slice(0, currentPage * pageSize)

  useEffect(() => {
    setCurrentPage(1)
    setShowLoadMore(true)
  }, [router.asPath])

  const loadMore = () => {
    const nextPage = currentPage + 1
    setCurrentPage(nextPage)
    if (nextPage * pageSize >= posts.length) {
      setShowLoadMore(false)
    }
  }

  const scrollItems = useMemo(() => {
    return postsToShow.map(post => ({
      title: post.title,
      subtitle: [post.date?.start_date, post.category, post.summary].filter(Boolean).join(' · ').slice(0, 120),
      link: {
        text: locale.COMMON?.ARTICLE_DETAIL || '阅读更多',
        href: post.href
      }
    }))
  }, [postsToShow, locale])

  if (!posts || posts.length === 0) {
    return <BlogPostListEmpty />
  }

  return (
    <div className='w-full'>
      <div style={{ borderRadius: '24px', overflow: 'hidden' }}>
        <LiquidGlassScrollContainer items={scrollItems} height='600px' />
      </div>

      {showLoadMore && postsToShow.length < posts.length && (
        <div className='flex justify-center pt-4 sm:pt-6'>
          <LiquidGlassButton
            label={locale.COMMON.MORE || '加载更多'}
            btnStyle='blue'
            onTap={loadMore}
            width='200px'
            height='56px'
            className='rounded-2xl overflow-hidden'
          />
        </div>
      )}
    </div>
  )
}

export default BlogPostListScroll
