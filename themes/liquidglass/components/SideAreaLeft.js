import { useGlobal } from '@/lib/global'
import LazyImage from '@/components/LazyImage'
import CONFIG from '../config'
import { siteConfig } from '@/lib/config'
import { useRouter } from 'next/router'
import { useMemo } from 'react'
import LiquidGlassButtonGroup from './LiquidGlassButtonGroup'
import DarkModeButton from './DarkModeButton'
import dynamic from 'next/dynamic'

const Live2D = dynamic(() => import('@/components/Live2D'), { ssr: false })

const SideAreaLeft = (props) => {
  const { locale } = useGlobal()
  const { siteInfo } = props
  const router = useRouter()

  const navButtons = useMemo(() => [
    { id: '/', label: locale.NAV?.HOME || '首页', style: router.asPath === '/' ? 'blue' : 'transparent' },
    siteConfig('LIQUID_MENU_CATEGORY', null, CONFIG) && { id: '/category', label: locale.COMMON.CATEGORY, style: router.asPath.startsWith('/category') ? 'blue' : 'transparent' },
    siteConfig('LIQUID_MENU_TAG', null, CONFIG) && { id: '/tag', label: locale.COMMON.TAGS, style: router.asPath.startsWith('/tag') ? 'blue' : 'transparent' },
    siteConfig('LIQUID_MENU_ARCHIVE', null, CONFIG) && { id: '/archive', label: locale.COMMON.ARCHIVE || '归档', style: router.asPath.startsWith('/archive') ? 'blue' : 'transparent' },
  ].filter(Boolean), [router.asPath, locale])

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

        {/* 液态玻璃导航按钮 — 单 frame 垂直排列 */}
        <div className='rounded-2xl overflow-hidden'>
          <LiquidGlassButtonGroup
            buttons={navButtons}
            onTap={(id) => router.push(id)}
            width='100%'
            className='rounded-2xl overflow-hidden'
            fallbackClassName='text-gray-600 dark:text-gray-400'
          />
        </div>

        {/* 主题切换 */}
        <div className='flex justify-center mt-4'>
          <DarkModeButton />
        </div>

        {/* 宠物挂件 */}
        <div className='flex justify-center mt-4'>
          <Live2D />
        </div>
      </div>
    </aside>
  )
}

export default SideAreaLeft
