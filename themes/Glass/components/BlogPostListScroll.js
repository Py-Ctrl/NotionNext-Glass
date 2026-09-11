import { useGlobal } from '@/lib/global'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import BlogPostCard from './BlogPostCard'
import BlogPostListEmpty from './BlogPostListEmpty'
import GlassButton from './GlassButton'
import { usePostListLayout } from './usePostListLayout'
import { siteConfig } from '@/lib/config'
import CONFIG from '../config'

const BlogPostListScroll = ({ posts = [], showSummary, siteInfo }) => {
  const { locale } = useGlobal()
  const router = useRouter()
  const { layout } = usePostListLayout()
  const [currentPage, setCurrentPage] = useState(1)
  const [showLoadMore, setShowLoadMore] = useState(true)
  const pageSize = siteConfig('POSTS_PER_PAGE', 6, CONFIG)
  const isGrid = layout === 'hover'

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

  if (!posts || posts.length === 0) {
    return <BlogPostListEmpty />
  }

  return (
    <div className='w-full'>
      <div
        className={
          isGrid
            ? 'glass-hover-grid grid gap-5 grid-cols-1 sm:grid-cols-2 2xl:grid-cols-3'
            : 'space-y-4 sm:space-y-6'
        }>
        {postsToShow.map((post, index) => (
          <BlogPostCard
            key={post.id}
            post={post}
            index={index}
            showSummary={showSummary}
            disableAos={isGrid}
          />
        ))}
      </div>

      {showLoadMore && postsToShow.length < posts.length && (
        <div className='flex justify-center pt-6 sm:pt-8'>
          <GlassButton
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
