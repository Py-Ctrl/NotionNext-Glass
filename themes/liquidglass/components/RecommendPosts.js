import SmartLink from '@/components/SmartLink'
import BlogPostCard from './BlogPostCard'

const RecommendPosts = ({ recommendPosts }) => {
  if (!recommendPosts || recommendPosts.length === 0) return null

  return (
    <div className='mt-8'>
      <h3 className='text-sm font-medium text-gray-500 dark:text-gray-400 mb-4'>
        <i className='fas fa-thumbs-up mr-2 text-indigo-400' />
        推荐阅读
      </h3>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        {recommendPosts.slice(0, 4).map((post, index) => (
          <BlogPostCard key={post.id} post={post} index={index} />
        ))}
      </div>
    </div>
  )
}

export default RecommendPosts
