import { useGlobal } from '@/lib/global'
import { siteConfig } from '@/lib/config'

const ArticleCopyright = ({ post }) => {
  const { locale } = useGlobal()

  if (!post) return null

  return (
    <div className='glass-card p-4 mt-6 text-sm text-gray-500 dark:text-gray-400'>
      <div className='flex items-center gap-2 mb-2'>
        <i className='fas fa-copyright text-indigo-400' />
        <span className='font-medium text-gray-700 dark:text-gray-300'>
          {locale.COMMON.COPYRIGHT || '版权声明'}
        </span>
      </div>
      <p>
        {post?.title || '本文'} 由 {siteConfig('AUTHOR')} 创作，采用
        <a
          href='https://creativecommons.org/licenses/by-nc-sa/4.0/'
          target='_blank'
          rel='noreferrer'
          className='glass-link mx-1'>
          CC BY-NC-SA 4.0
        </a>
        许可协议。
      </p>
    </div>
  )
}

export default ArticleCopyright