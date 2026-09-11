import { useGlobal } from '@/lib/global'

const BlogPostListEmpty = () => {
  const { locale } = useGlobal()

  return (
    <div className='glass-card p-12 text-center'>
      <div className='text-4xl mb-4 opacity-30'>
        <i className='fas fa-inbox' />
      </div>
      <p className='text-gray-500 dark:text-gray-400 text-sm'>
        {locale.COMMON.NO_MORE || '暂无文章'}
      </p>
    </div>
  )
}

export default BlogPostListEmpty