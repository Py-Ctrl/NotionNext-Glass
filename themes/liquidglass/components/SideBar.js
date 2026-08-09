import { useGlobal } from '@/lib/global'
import SmartLink from '@/components/SmartLink'
import { siteConfig } from '@/lib/config'
import CONFIG from '../config'
import { useRouter } from 'next/router'
import { useRef } from 'react'
import Logo from './Logo'
import SearchInput from './SearchInput'
import TagGroups from './TagGroups'
import CategoryGroup from './CategoryGroup'

const SideBar = (props) => {
  const { tags, currentTag, categories, currentCategory, post } = props
  const { locale } = useGlobal()
  const router = useRouter()

  return (
    <aside className='glass-sidebar p-6 sticky top-8'>
      {/* 搜索 */}
      {siteConfig('LIQUID_MENU_SEARCH', null, CONFIG) && (
        <div className='mb-6'>
          <SearchInput {...props} onSearch={(key) => {
            if (key) {
              router.push({ pathname: '/search/' + key })
            }
          }} />
        </div>
      )}

      {/* Logo */}
      <div className='flex items-center justify-between mb-6'>
        <Logo {...props} />
      </div>

      {/* 分类 */}
      {siteConfig('LIQUID_MENU_CATEGORY', null, CONFIG) && categories && (
        <section className='mb-6'>
          <div className='flex items-center justify-between mb-2'>
            <h3 className='text-sm font-medium text-gray-500 dark:text-gray-400'>
              <i className='mr-2 fas fa-th-list' />
              {locale.COMMON.CATEGORY}
            </h3>
            <SmartLink href='/category' className='glass-link text-xs'>
              {locale.COMMON.MORE}
            </SmartLink>
          </div>
          <CategoryGroup currentCategory={currentCategory} categories={categories} />
        </section>
      )}

      {/* 标签 */}
      {siteConfig('LIQUID_MENU_TAG', null, CONFIG) && tags && (
        <section className='mb-6'>
          <div className='flex items-center justify-between mb-2'>
            <h3 className='text-sm font-medium text-gray-500 dark:text-gray-400'>
              <i className='mr-2 fas fa-tag' />
              {locale.COMMON.TAGS}
            </h3>
            <SmartLink href='/tag' className='glass-link text-xs'>
              {locale.COMMON.MORE}
            </SmartLink>
          </div>
          <TagGroups tags={tags} currentTag={currentTag} />
        </section>
      )}

      {/* 归档 */}
      {siteConfig('LIQUID_MENU_ARCHIVE', null, CONFIG) && (
        <section>
          <SmartLink
            href='/archive'
            className='glass-btn w-full flex items-center justify-center gap-2 text-gray-600 dark:text-gray-400'>
            <i className='fas fa-archive' />
            {locale.COMMON.ARCHIVE || '归档'}
          </SmartLink>
        </section>
      )}
    </aside>
  )
}

export default SideBar