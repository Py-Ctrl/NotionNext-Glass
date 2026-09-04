import { siteConfig } from '@/lib/config'
import { useGlobal } from '@/lib/global'
import { useRouter } from 'next/router'
import GlassButton from './GlassButton'

/**
 * 随机跳转到一篇文章 - "随便逛逛"按钮（CSS + SVG 透镜玻璃）
 */
export default function RandomPostButton({ latestPosts }) {
  const router = useRouter()
  const { locale } = useGlobal()

  const handleClick = () => {
    if (!latestPosts || latestPosts.length === 0) {
      router.push('/')
      return
    }
    const randomIndex = Math.floor(Math.random() * latestPosts.length)
    const randomPost = latestPosts[randomIndex]
    router.push(`${siteConfig('SUB_PATH', '')}/${randomPost?.slug}`)
  }

  return (
    <div className='flex justify-center'>
      <GlassButton
        label={locale.MENU?.WALK_AROUND || '随便逛逛'}
        btnStyle='surface'
        onTap={handleClick}
        width='100%'
        height='44px'
        className='rounded-xl'
        fallbackClassName='liquid-glass-btn liquid-glass-btn-surface w-full rounded-xl'
      />
    </div>
  )
}
