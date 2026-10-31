import { siteConfig } from '@/lib/config'
import { SiteStatsText } from './SiteStatsCard'

/**
 * 顶部悬浮信息栏（仅桌面端）
 *
 * 原页脚底部的两行内容搬到这里常驻：左侧版权、中间站点统计，右侧搜索入口。
 * 移动端不渲染 —— 手机顶部已经有 TopNav，两条顶栏会打架。
 */
const InfoBar = ({ title, searchModal, ...props }) => {
  const currentYear = new Date().getFullYear()
  const since = siteConfig('SINCE')

  return (
    <div
      id='glass-infobar'
      /* 定位与圆角必须走内联：
         style.js 里 #theme-glass .glass-card 写了 position: relative / border-radius，
         id + class 的权重高于 Tailwind 的单类选择器，写 className 会被打回文档流
         （交接文档「坑-1」，子菜单曾因此被挤到页面最底部） */
      style={{
        position: 'fixed',
        left: '50%',
        transform: 'translateX(-50%)',
        borderRadius: 9999,
        // 宽度跟着视口放大；高度 / 内边距 / 字号走 rem，随根字号自动缩放
        width: 'min(calc(1120px * var(--glass-u, 1)), calc(100% - 3rem))'
      }}
      className='glass-card hidden lg:flex items-center gap-6 top-3 z-40 h-12 px-5'>
      {/* 版权 */}
      <div className='relative z-10 flex items-center gap-2 whitespace-nowrap text-xs font-medium text-gray-700 dark:text-gray-300'>
        <i className='fas fa-copyright text-[0.625rem]' />
        <span>
          {since && since !== currentYear ? `${since}-` : ''}
          {currentYear} {title || siteConfig('TITLE')}
        </span>
      </div>

      {/* 站点统计（紧凑版：去掉「站点统计」标题，只留四项） */}
      <div className='relative z-10 flex min-w-0 flex-1 justify-center'>
        <SiteStatsText compact {...props} />
      </div>

      {/* 搜索入口 */}
      <button
        type='button'
        onClick={() => searchModal?.current?.openSearch()}
        title='搜索文章'
        aria-label='搜索文章'
        className='relative z-10 flex h-8 w-8 flex-shrink-0 cursor-pointer items-center justify-center rounded-full text-gray-600 transition-colors hover:bg-black/5 dark:text-gray-300 dark:hover:bg-white/10'>
        <i className='fas fa-search text-sm' />
      </button>
    </div>
  )
}

export default InfoBar
