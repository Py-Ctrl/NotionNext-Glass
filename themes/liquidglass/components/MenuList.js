import { siteConfig } from '@/lib/config'
import CONFIG from '../config'
import { useGlobal } from '@/lib/global'
import SmartLink from '@/components/SmartLink'
import { useRouter } from 'next/router'

const MenuList = (props) => {
  const { locale } = useGlobal()
  const { customMenu, customNav } = props
  const router = useRouter()

  return (
    <div className='p-4 space-y-1'>
      {/* 首页 */}
      <SmartLink href='/'
        className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-colors ${
          router.asPath === '/'
            ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'
        }`}>
        <i className='fas fa-home w-5 text-center' />
        <span>{locale.NAV?.HOME || '首页'}</span>
      </SmartLink>

      {/* 分类 */}
      {siteConfig('LIQUID_MENU_CATEGORY', null, CONFIG) && (
        <SmartLink href='/category'
          className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-colors ${
            router.asPath.startsWith('/category')
              ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'
          }`}>
          <i className='fas fa-th-list w-5 text-center' />
          <span>{locale.COMMON.CATEGORY}</span>
        </SmartLink>
      )}

      {/* 标签 */}
      {siteConfig('LIQUID_MENU_TAG', null, CONFIG) && (
        <SmartLink href='/tag'
          className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-colors ${
            router.asPath.startsWith('/tag')
              ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'
          }`}>
          <i className='fas fa-tag w-5 text-center' />
          <span>{locale.COMMON.TAGS}</span>
        </SmartLink>
      )}

      {/* 归档 */}
      {siteConfig('LIQUID_MENU_ARCHIVE', null, CONFIG) && (
        <SmartLink href='/archive'
          className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-colors ${
            router.asPath.startsWith('/archive')
              ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'
          }`}>
          <i className='fas fa-archive w-5 text-center' />
          <span>{locale.COMMON.ARCHIVE || '归档'}</span>
        </SmartLink>
      )}

      {/* 搜索 */}
      {siteConfig('LIQUID_MENU_SEARCH', null, CONFIG) && (
        <SmartLink href='/search'
          className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-colors ${
            router.asPath.startsWith('/search')
              ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'
          }`}>
          <i className='fas fa-search w-5 text-center' />
          <span>{locale.COMMON.SEARCH || '搜索'}</span>
        </SmartLink>
      )}

      {/* 自定义菜单 */}
      {customMenu?.map(menu => (
        <SmartLink
          key={menu.name}
          href={menu.href}
          className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-colors text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50`}>
          {menu.icon && <i className={`${menu.icon} w-5 text-center`} />}
          <span>{menu.name}</span>
        </SmartLink>
      ))}
    </div>
  )
}

export { MenuList }