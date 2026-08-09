import { useGlobal } from '@/lib/global'
import SmartLink from '@/components/SmartLink'

const BlogAround = ({ prev, next }) => {
  const { locale } = useGlobal()

  if (!prev && !next) return null

  return (
    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
      {prev && (
        <SmartLink href={prev?.href} className='glass-card p-4 group hover:border-indigo-300 dark:hover:border-indigo-700'>
          <div className='text-xs text-gray-400 dark:text-gray-500 mb-1'>
            <i className='fas fa-chevron-left mr-1' />
            {locale.COMMON.PREV_POST || '上一篇'}
          </div>
          <div className='text-sm text-gray-700 dark:text-gray-300 group-hover:text-indigo-500 transition-colors truncate'>
            {prev.title}
          </div>
        </SmartLink>
      )}
      {next && (
        <SmartLink href={next?.href} className='glass-card p-4 group hover:border-indigo-300 dark:hover:border-indigo-700 md:text-right'>
          <div className='text-xs text-gray-400 dark:text-gray-500 mb-1'>
            {locale.COMMON.NEXT_POST || '下一篇'}
            <i className='fas fa-chevron-right ml-1' />
          </div>
          <div className='text-sm text-gray-700 dark:text-gray-300 group-hover:text-indigo-500 transition-colors truncate'>
            {next.title}
          </div>
        </SmartLink>
      )}
    </div>
  )
}

export default BlogAround