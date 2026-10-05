import { useGlobal } from '@/lib/global'
import SmartLink from '@/components/SmartLink'
import { siteConfig } from '@/lib/config'
import { SiteStatsText } from './SiteStatsCard'

const Footer = ({ title, ...props }) => {
  const { locale } = useGlobal()
  const d = new Date()
  const currentYear = d.getFullYear()
  const since = siteConfig('SINCE')
  const version = process.env.npm_package_version || '4.10.9'

  return (
    // pb-28：给底部固定标签栏让位。main 上原来也有一份 pb-28，两段叠起来
    // 会多出 224px 死空白，所以那份已移除，只保留页脚这一份
    <footer className='glass-footer w-full pt-4 sm:pt-6 pb-28 px-4 mt-12'>
      <div className='max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600 dark:text-gray-400'>
        <div className='flex items-center gap-2'>
          <i className='fas fa-copyright text-xs' />
          <span>
            {since && since !== currentYear ? `${since}-` : ''}
            {currentYear} {title || siteConfig('TITLE')}
          </span>
        </div>

        <div className='flex items-center gap-3 sm:gap-4'>
          <SmartLink href='/archive' className='glass-link'>
            <i className='fas fa-archive mr-1' />
            <span className='hidden sm:inline'>{locale.COMMON.ARCHIVE || '归档'}</span>
          </SmartLink>
          <span className='text-gray-300 dark:text-gray-600 hidden sm:inline'>|</span>
          <span className='opacity-60 hidden md:inline'>
            Powered by NotionNext v{version} & Glass
          </span>
        </div>
      </div>

      {/* 站点统计（文字版）：文章数 / 建站天数 / 访问量 / 访客数 */}
      <div className='max-w-6xl mx-auto mt-5'>
        <SiteStatsText
          postCount={props.postCount}
          allPosts={props.allPosts}
          categoryOptions={props.categoryOptions}
          posts={props.posts}
        />
      </div>
    </footer>
  )
}

export default Footer