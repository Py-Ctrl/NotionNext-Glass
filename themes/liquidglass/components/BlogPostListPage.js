import BlogPostCard from './BlogPostCard'
import BlogPostListEmpty from './BlogPostListEmpty'
import PaginationNumber from './PaginationNumber'

const BlogPostListPage = ({ posts = [], page, totalPage, showSummary, siteInfo }) => {
  if (!posts || posts.length === 0) {
    return <BlogPostListEmpty />
  }

  return (
    <div className='space-y-6 w-full'>
      {posts.map((post, index) => (
        <BlogPostCard
          key={post.id}
          post={post}
          index={index}
          showSummary={showSummary}
        />
      ))}

      <PaginationNumber page={page} totalPage={totalPage} />
    </div>
  )
}

export default BlogPostListPage
