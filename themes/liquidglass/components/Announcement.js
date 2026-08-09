import { useGlobal } from '@/lib/global'
import SmartLink from '@/components/SmartLink'

const Announcement = ({ post }) => {
  if (!post) return null

  return (
    <div className='glass-card p-4 text-sm text-gray-600 dark:text-gray-400'>
      <div className='flex items-center gap-2 mb-1'>
        <i className='fas fa-bullhorn text-indigo-400' />
        <span className='font-medium text-gray-700 dark:text-gray-300'>公告</span>
      </div>
      <SmartLink href={post?.href} className='glass-link'>
        {post.title}
      </SmartLink>
    </div>
  )
}

export default Announcement