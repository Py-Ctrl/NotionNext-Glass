import { useGlobal } from '@/lib/global'
import { useRouter } from 'next/router'
import { useEffect, useRef, useState } from 'react'
import BlogPostCard from './BlogPostCard'
import BlogPostListEmpty from './BlogPostListEmpty'
import LoadingCover from '@/components/LoadingCover'

const BlogPostListScroll = ({ posts = [], showSummary, siteInfo }) => {
  const { locale } = useGlobal()
  const router = useRouter()
  const [currentPage, setCurrentPage] = useState(1)
  const [showLoadMore, setShowLoadMore] = useState(true)
  const pageSize = 6

  const postsToShow = posts.slice(0, currentPage * pageSize)

  useEffect(() => {
    setCurrentPage(1)
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
    <div className='space-y-6 w-full'>
      {postsToShow.map((post, index) => (
        <BlogPostCard
          key={post.id}
          post={post}
          index={index}
          showSummary={showSummary}
        />
      ))}

      {showLoadMore && postsToShow.length < posts.length && (
        <div className='flex justify-center pt-4'>
          <button onClick={loadMore} className='glass-btn text-indigo-500 dark:text-indigo-400'>
            <i className='fas fa-chevron-down mr-2' />
            {locale.COMMON.MORE || '加载更多'}
          </button>
        </div>
      )}
    </div>
  )
}

export default BlogPostListScroll