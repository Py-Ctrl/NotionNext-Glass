import { useGlobal } from '@/lib/global'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import BlogPostCard from './BlogPostCard'
import BlogPostListEmpty from './BlogPostListEmpty'
import GlassButton from './GlassButton'

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

  if (!posts || posts.length === 0) {
    return <BlogPostListEmpty />
  }

  return (
    <div className='space-y-4 sm:space-y-6 w-full'>
      {postsToShow.map((post, index) => (
        <BlogPostCard
          key={post.id}
          post={post}
          index={index}
          showSummary={showSummary}
        />
      ))}

      {showLoadMore && postsToShow.length < posts.length && (
        <div className='flex justify-center pt-2 sm:pt-4'>
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
