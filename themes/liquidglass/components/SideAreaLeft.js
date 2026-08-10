import { useGlobal } from '@/lib/global'
import LazyImage from '@/components/LazyImage'
import CONFIG from '../config'
import { siteConfig } from '@/lib/config'
import { useRouter } from 'next/router'
import DarkModeButton from './DarkModeButton'
import SocialButton from './SocialButton'
import MusicPlayer from './MusicPlayer'
import dynamic from 'next/dynamic'

const Live2D = dynamic(() => import('@/components/Live2D'), { ssr: false })

const SideAreaLeft = (props) => {
  const { locale } = useGlobal()
  const { siteInfo } = props
  const router = useRouter()
  const musicPlayerEnabled = siteConfig('MUSIC_PLAYER')

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
        <div className='flex justify-center mt-4'>
          <DarkModeButton />
        </div>

        {/* 联系方式 */}
        <div className='mt-5 pt-4 border-t border-gray-200/30 dark:border-gray-700/30'>
          <SocialButton />
        </div>

        {/* 音乐播放器 */}
        {musicPlayerEnabled && (
          <div className='mt-5 pt-4 border-t border-gray-200/30 dark:border-gray-700/30'>
            <MusicPlayer />
          </div>
        )}

        {/* 宠物挂件 */}
        <div className='flex justify-center mt-4'>
          <Live2D />
        </div>
      </div>
    </aside>
  )
}

export default SideAreaLeft
