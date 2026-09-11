import BlogPostCard from './BlogPostCard'
import BlogPostListEmpty from './BlogPostListEmpty'
import PaginationNumber from './PaginationNumber'
import { usePostListLayout } from './usePostListLayout'

const BlogPostListPage = ({ posts = [], page, totalPage, showSummary, siteInfo }) => {
  const { layout } = usePostListLayout()
  if (!posts || posts.length === 0) {
    return <BlogPostListEmpty />
  }
  const isGrid = layout === 'hover'

  return (
    <div className='w-full'>
      <div
        className={
          isGrid
            ? 'glass-hover-grid grid gap-5 grid-cols-1 sm:grid-cols-2 2xl:grid-cols-3'
            : 'space-y-6'
        }>
        {posts.map((post, index) => (
          <BlogPostCard
            key={post.id}
            post={post}
            index={index}
            showSummary={showSummary}
            disableAos={isGrid}
          />
        ))}
      </div>

      <PaginationNumber page={page} totalPage={totalPage} />
    </div>
  )
}

export default BlogPostListPage
