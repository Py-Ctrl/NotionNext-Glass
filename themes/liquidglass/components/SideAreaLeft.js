import { useGlobal } from '@/lib/global'
import SmartLink from '@/components/SmartLink'
import LazyImage from '@/components/LazyImage'
import CONFIG from '../config'
import { siteConfig } from '@/lib/config'
import Logo from './Logo'
import DarkModeButton from './DarkModeButton'
import { useRouter } from 'next/router'

const SideAreaLeft = (props) => {
  const { locale } = useGlobal()
  const { siteInfo } = props
  const router = useRouter()

  const navItems = [
    { href: '/', icon: 'fas fa-home', label: locale.NAV?.HOME || '首页', active: router.asPath === '/' },
    siteConfig('LIQUID_MENU_CATEGORY', null, CONFIG) && { href: '/category', icon: 'fas fa-th-list', label: locale.COMMON.CATEGORY, active: router.asPath.startsWith('/category') },
    siteConfig('LIQUID_MENU_TAG', null, CONFIG) && { href: '/tag', icon: 'fas fa-tag', label: locale.COMMON.TAGS, active: router.asPath.startsWith('/tag') },
    siteConfig('LIQUID_MENU_ARCHIVE', null, CONFIG) && { href: '/archive', icon: 'fas fa-archive', label: locale.COMMON.ARCHIVE || '归档', active: router.asPath.startsWith('/archive') },
  ].filter(Boolean)

  return (
    <aside className='hidden lg:block w-56 xl:w-60 shrink-0 mr-1 xl:mr-2'>
      <div className='glass-sidebar p-5 sticky top-6'>
        {/* 头像 + 标题 */}
        <div className='flex flex-col items-center mb-6'>
          <div className='w-16 h-16 rounded-full overflow-hidden ring-2 ring-white/40 dark:ring-white/10 mb-3 hover:rotate-12 hover:scale-110 transition-transform duration-300 cursor-pointer'
               onClick={() => router.push('/')}>
            <LazyImage
              priority={true}
              src={siteInfo?.icon}
              className='rounded-full w-full h-full object-cover'
              width={64}
              height={64}
              alt={siteConfig('AUTHOR')}
            />
          </div>
          <div className='text-sm font-semibold text-gray-800 dark:text-gray-200 text-center truncate max-w-full'>
            {siteConfig('AUTHOR')}
          </div>
          <div className='text-xs text-gray-500 dark:text-gray-400 text-center mt-1'>
            {siteConfig('BIO')}
          </div>
        </div>

        {/* 主题切换 */}
        <div className='flex justify-end mb-3'>
          <DarkModeButton />
        </div>

        {/* 导航菜单 */}
        <nav className='space-y-1'>
          {navItems.map((item, idx) => (
            <SmartLink
              key={idx}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                item.active
                  ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-medium'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'
              }`}>
              <i className={`${item.icon} w-5 text-center`} />
              <span>{item.label}</span>
            </SmartLink>
          ))}
        </nav>
      </div>
    </aside>
  )
}

export default SideAreaLeft