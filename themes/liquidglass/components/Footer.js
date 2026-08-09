import { useGlobal } from '@/lib/global'
import SmartLink from '@/components/SmartLink'
import { siteConfig } from '@/lib/config'

const Footer = ({ title }) => {
  const { locale } = useGlobal()
  const d = new Date()
  const currentYear = d.getFullYear()
  const since = siteConfig('SINCE')

  return (
    <footer className='glass-footer w-full py-4 sm:py-6 px-4 mt-12'>
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
            Powered by NotionNext & Liquid Glass
          </span>
        </div>
      </div>
    </footer>
  )
}

export default Footer