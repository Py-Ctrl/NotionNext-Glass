import { useGlobal } from '@/lib/global'
import SmartLink from '@/components/SmartLink'
import { formatDateFmt } from '@/lib/utils/formatDate'
import TagItemMini from './TagItemMini'

const BlogPostArchive = ({ posts = [], archiveTitle }) => {
  const { locale } = useGlobal()

  return (
    <div className='mb-8'>
      <h2 className='text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4'>
        <i className='fas fa-calendar mr-2 text-indigo-400' />
        {archiveTitle}
      </h2>
      <div className='space-y-2'>
        {posts.map(post => (
          <SmartLink
            key={post.id}
            href={post?.href}
            className='glass-card p-3 flex items-center justify-between group hover:border-indigo-300 dark:hover:border-indigo-700'>
            <div className='flex items-center gap-3 min-w-0'>
              <span className='text-xs text-gray-400 dark:text-gray-500 shrink-0'>
                {formatDateFmt(post?.publishDate, 'MM-dd')}
              </span>
              <span className='text-sm text-gray-700 dark:text-gray-300 group-hover:text-indigo-500 transition-colors truncate'>
                {post.title}
              </span>
            </div>
            {post?.category && (
              <span className='glass-tag text-xs shrink-0 ml-2 hidden sm:block'>
                {post.category}
              </span>
            )}
          </SmartLink>
        ))}
      </div>
    </div>
  )
}

export default BlogPostArchive