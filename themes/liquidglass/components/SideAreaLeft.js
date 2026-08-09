import { useGlobal } from '@/lib/global'
import SmartLink from '@/components/SmartLink'
import CONFIG from '../config'
import { siteConfig } from '@/lib/config'
import Logo from './Logo'
import DarkModeButton from './DarkModeButton'
import { useRouter } from 'next/router'

const SideAreaLeft = (props) => {
  const { locale } = useGlobal()
  const { siteInfo } = props
  const router = useRouter()

  return (
    <aside className='hidden lg:block w-64 shrink-0'>
      <div className='glass-sidebar p-6 sticky top-8'>
        <div className='flex items-center justify-between mb-6'>
          <Logo {...props} />
          <DarkModeButton />
        </div>

        <nav className='space-y-1'>
          <SmartLink href='/'
            className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors ${
              router.asPath === '/'
                ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'
            }`}>
            <i className='fas fa-home w-5 text-center' />
            {locale.NAV?.HOME || '首页'}
          </SmartLink>

          {siteConfig('LIQUID_MENU_CATEGORY', null, CONFIG) && (
            <SmartLink href='/category'
              className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors ${
                router.asPath.startsWith('/category')
                  ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'
              }`}>
              <i className='fas fa-th-list w-5 text-center' />
              {locale.COMMON.CATEGORY}
            </SmartLink>
          )}

          {siteConfig('LIQUID_MENU_TAG', null, CONFIG) && (
            <SmartLink href='/tag'
              className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors ${
                router.asPath.startsWith('/tag')
                  ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'
              }`}>
              <i className='fas fa-tag w-5 text-center' />
              {locale.COMMON.TAGS}
            </SmartLink>
          )}

          {siteConfig('LIQUID_MENU_ARCHIVE', null, CONFIG) && (
            <SmartLink href='/archive'
              className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors ${
                router.asPath.startsWith('/archive')
                  ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'
              }`}>
              <i className='fas fa-archive w-5 text-center' />
              {locale.COMMON.ARCHIVE || '归档'}
            </SmartLink>
          )}
        </nav>
      </div>
    </aside>
  )
}

export default SideAreaLeft