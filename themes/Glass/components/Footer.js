import { useGlobal } from '@/lib/global'
import SmartLink from '@/components/SmartLink'

/**
 * 页脚
 *
 * 版权行与站点统计已搬到顶部悬浮栏（components/InfoBar.js），
 * 这里只保留归档入口与版本信息，不再占两行高度。
 */
const Footer = () => {
  const { locale } = useGlobal()
  const version = process.env.npm_package_version || '4.10.9'

  return (
    // 让位留白不放在这里 —— 放在页脚外面（index.js 里的透明占位块），
    // 否则玻璃条本身会被撑成一大块灰带
    <footer className='glass-footer w-full px-4 py-4 mt-12 sm:py-6'>
      <div className='mx-auto flex max-w-6xl items-center justify-center gap-3 text-xs font-medium text-gray-700 sm:gap-4 sm:text-sm dark:text-gray-300'>
        <SmartLink href='/archive' className='glass-link'>
          <i className='fas fa-archive mr-1' />
          <span>{locale.COMMON.ARCHIVE || '归档'}</span>
        </SmartLink>
        <span className='text-gray-300 dark:text-gray-600'>|</span>
        <span className='opacity-60'>Powered by NotionNext v{version} & Glass</span>
      </div>
    </footer>
  )
}

export default Footer
