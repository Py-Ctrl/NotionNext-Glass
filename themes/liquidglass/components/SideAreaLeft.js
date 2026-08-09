import { useGlobal } from '@/lib/global'
import LazyImage from '@/components/LazyImage'
import CONFIG from '../config'
import { siteConfig } from '@/lib/config'
import { useRouter } from 'next/router'
import LiquidGlassButton from './LiquidGlassButton'

const SideAreaLeft = (props) => {
  const { locale } = useGlobal()
  const { siteInfo } = props
  const router = useRouter()

  const navItems = [
    { href: '/', label: locale.NAV?.HOME || '首页', active: router.asPath === '/' },
    siteConfig('LIQUID_MENU_CATEGORY', null, CONFIG) && { href: '/category', label: locale.COMMON.CATEGORY, active: router.asPath.startsWith('/category') },
    siteConfig('LIQUID_MENU_TAG', null, CONFIG) && { href: '/tag', label: locale.COMMON.TAGS, active: router.asPath.startsWith('/tag') },
    siteConfig('LIQUID_MENU_ARCHIVE', null, CONFIG) && { href: '/archive', label: locale.COMMON.ARCHIVE || '归档', active: router.asPath.startsWith('/archive') },
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

        {/* 液态玻璃导航按钮 — 纵向排列 */}
        <div className='flex flex-col gap-2'>
          {navItems.map((item, idx) => (
            <div
              key={idx}
              className='rounded-2xl overflow-hidden'
              style={{ width: '100%', height: '52px' }}
            >
              <LiquidGlassButton
                label={item.label}
                btnStyle={item.active ? 'blue' : 'transparent'}
                onTap={() => router.push(item.href)}
                width='100%'
                height='52px'
                className='rounded-2xl overflow-hidden'
                fallbackClassName={
                  item.active
                    ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border-indigo-300 text-sm'
                    : 'text-gray-600 dark:text-gray-400 text-sm'
                }
              />
            </div>
          ))}
        </div>
      </div>
    </aside>
  )
}

export default SideAreaLeft
