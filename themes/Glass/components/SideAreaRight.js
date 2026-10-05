import { useGlobal } from '@/lib/global'
import CONFIG from '../config'
import { siteConfig } from '@/lib/config'
import { useRouter } from 'next/router'
import SearchInput from './SearchInput'
import TagGroups from './TagGroups'
import CategoryGroup from './CategoryGroup'
import SmartLink from '@/components/SmartLink'
import Announcement from './Announcement'
import GlassScrollContainer from './GlassScrollContainer'
import { useLensBackdrop } from './useLensBackdrop'

const SideAreaRight = (props) => {
  const { tags, currentTag, categories, currentCategory, slot, notice, latestPosts, allPosts, postCount, categoryOptions, posts } = props
  const { locale } = useGlobal()
  const router = useRouter()
  // 右侧栏卡片：SVG 透镜折射（refractionHeight 16 / mag 32 / 无模糊 / saturate 1.5）
  const lens = useLensBackdrop({ refractionHeight: 16, maxMag: 32, blur: 0, saturate: 1.5 })

  return (
    <aside className='hidden xl:block w-72 shrink-0 ml-4 xl:ml-8'>
      <div ref={lens.elRef} className='glass-sidebar p-5 sticky top-6' style={lens.style || undefined}>
        {lens.filterNode}
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

        {/* 最新发布（从文章上方挪过来的横向滚动容器；站点统计已挪到页脚） */}
        {siteConfig('LIQUID_SCROLL_CONTAINER', true, CONFIG) && (
          <div className='mb-5'>
            <GlassScrollContainer
              title={locale.COMMON?.LATEST_POSTS || '最新发布'}
              height={240}
              items={(latestPosts || []).slice(0, 12).map(p => ({
                key: p.id,
                title: p.title,
                subtitle: p.date?.start_date,
                linkText: locale.COMMON?.ARTICLE_DETAIL || '阅读',
                href: p.href
              }))}
            />
          </div>
        )}

        {/* 自定义 slot */}
        {slot}

        {/* 分类 */}
        {siteConfig('LIQUID_MENU_CATEGORY', null, CONFIG) && categories && (
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
            <CategoryGroup currentCategory={currentCategory} categories={categories} />
          </section>
        )}

        {/* 标签 */}
        {siteConfig('LIQUID_MENU_TAG', null, CONFIG) && tags && (
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
            <TagGroups tags={tags} currentTag={currentTag} />
          </section>
        )}
      </div>
    </aside>
  )
}

export default SideAreaRight
