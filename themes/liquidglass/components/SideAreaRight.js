import { useGlobal } from '@/lib/global'
import CONFIG from '../config'
import { siteConfig } from '@/lib/config'
import { useRouter } from 'next/router'
import { useMemo } from 'react'
import SearchInput from './SearchInput'
import SmartLink from '@/components/SmartLink'
import Announcement from './Announcement'
import LiquidGlassScrollContainer from './LiquidGlassScrollContainer'

const SideAreaRight = (props) => {
  const { tags, categories, slot, notice } = props
  const { locale } = useGlobal()
  const router = useRouter()

  const categoryItems = useMemo(() => {
    if (!categories || categories.length === 0) return []
    return categories.map(category => ({
      title: category.name,
      subtitle: `${category.count || 0} ${locale.COMMON?.ARTICLES || '篇文章'}`,
      link: {
        text: locale.COMMON?.MORE || '查看',
        href: `/category/${category.name}`
      }
    }))
  }, [categories, locale])

  const tagItems = useMemo(() => {
    if (!tags || tags.length === 0) return []
    return tags.map(tag => ({
      title: tag.name,
      subtitle: `${tag.count || 0} ${locale.COMMON?.ARTICLES || '篇文章'}`,
      link: {
        text: locale.COMMON?.MORE || '查看',
        href: `/tag/${encodeURIComponent(tag.name)}`
      }
    }))
  }, [tags, locale])

  return (
    <aside className='hidden xl:block w-72 shrink-0 ml-4 xl:ml-8'>
      <div className='glass-sidebar p-5 sticky top-6'>
        {/* 搜索框 */}
        {siteConfig('LIQUID_MENU_SEARCH', null, CONFIG) && (
          <div className='mb-5'>
            <SearchInput {...props} compact onSearch={(key) => {
              if (key) {
                router.push({ pathname: '/search/' + key })
              }
            }} />
          </div>
        )}

        {/* 公告 */}
        {notice && (
          <div className='mb-5'>
            <Announcement post={notice} />
          </div>
        )}

        {/* 自定义 slot */}
        {slot}

        {/* 分类 */}
        {siteConfig('LIQUID_MENU_CATEGORY', null, CONFIG) && categoryItems.length > 0 && (
          <section className='mb-5'>
            <div className='flex items-center justify-between mb-2'>
              <h3 className='text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider'>
                <i className='mr-1.5 fas fa-th-list' />
                {locale.COMMON.CATEGORY}
              </h3>
              <SmartLink href='/category' className='glass-link text-xs'>
                {locale.COMMON.MORE}
              </SmartLink>
            </div>
            <div style={{ borderRadius: '20px', overflow: 'hidden' }}>
              <LiquidGlassScrollContainer
                items={categoryItems}
                height='300px'
              />
            </div>
          </section>
        )}

        {/* 标签 */}
        {siteConfig('LIQUID_MENU_TAG', null, CONFIG) && tagItems.length > 0 && (
          <section>
            <div className='flex items-center justify-between mb-2'>
              <h3 className='text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider'>
                <i className='mr-1.5 fas fa-tag' />
                {locale.COMMON.TAGS}
              </h3>
              <SmartLink href='/tag' className='glass-link text-xs'>
                {locale.COMMON.MORE}
              </SmartLink>
            </div>
            <div style={{ borderRadius: '20px', overflow: 'hidden' }}>
              <LiquidGlassScrollContainer
                items={tagItems}
                height='300px'
              />
            </div>
          </section>
        )}
      </div>
    </aside>
  )
}

export default SideAreaRight
