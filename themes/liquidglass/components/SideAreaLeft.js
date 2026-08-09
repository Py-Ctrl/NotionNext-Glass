import { useGlobal } from '@/lib/global'
import LazyImage from '@/components/LazyImage'
import CONFIG from '../config'
import { siteConfig } from '@/lib/config'
import { useRouter } from 'next/router'
import LiquidGlassTabs from './LiquidGlassTabs'

const ICONS = {
  home: 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z',
  category: 'M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z',
  tag: 'M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58.55 0 1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41 0-.55-.23-1.06-.59-1.42zM5.5 7C4.67 7 4 6.33 4 5.5S4.67 4 5.5 4 7 4.67 7 5.5 6.33 7 5.5 7z',
  archive: 'M20.54 5.23l-1.39-1.68C18.88 3.21 18.47 3 18 3H6c-.47 0-.88.21-1.16.55L3.46 5.23C3.17 5.57 3 6.02 3 6.5V19c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6.5c0-.48-.17-.93-.46-1.27zM12 17.5L6.5 12H10v-2h4v2h3.5L12 17.5zM5.12 5l.81-1h12l.94 1H5.12z'
}

const SideAreaLeft = (props) => {
  const { locale } = useGlobal()
  const { siteInfo } = props
  const router = useRouter()

  const navItems = [
    { href: '/', icon: ICONS.home, label: locale.NAV?.HOME || '首页' },
    siteConfig('LIQUID_MENU_CATEGORY', null, CONFIG) && { href: '/category', icon: ICONS.category, label: locale.COMMON.CATEGORY },
    siteConfig('LIQUID_MENU_TAG', null, CONFIG) && { href: '/tag', icon: ICONS.tag, label: locale.COMMON.TAGS },
    siteConfig('LIQUID_MENU_ARCHIVE', null, CONFIG) && { href: '/archive', icon: ICONS.archive, label: locale.COMMON.ARCHIVE || '归档' },
  ].filter(Boolean)

  const handleTabSelect = (index, tab) => {
    if (tab && tab.href) {
      router.push(tab.href)
    }
  }

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

        {/* 液态玻璃导航标签栏 */}
        <div className='rounded-2xl overflow-hidden mb-2' style={{ height: '120px' }}>
          <LiquidGlassTabs
            tabs={navItems}
            onSelect={handleTabSelect}
            width='100%'
            height='120px'
          />
        </div>
      </div>
    </aside>
  )
}

export default SideAreaLeft
