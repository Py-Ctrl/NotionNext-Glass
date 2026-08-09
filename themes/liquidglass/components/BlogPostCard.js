import NotionIcon from '@/components/NotionIcon'
import NotionPage from '@/components/NotionPage'
import TwikooCommentCount from '@/components/TwikooCommentCount'
import { siteConfig } from '@/lib/config'
import { useGlobal } from '@/lib/global'
import { formatDateFmt } from '@/lib/utils/formatDate'
import LazyImage from '@/components/LazyImage'
import SmartLink from '@/components/SmartLink'
import CONFIG from '../config'
import TagItemMini from './TagItemMini'

const BlogPostCard = ({ post, index, showSummary }) => {
  const { locale } = useGlobal()
  const showPreview =
    siteConfig('LIQUID_POST_LIST_PREVIEW', null, CONFIG) && post.blockMap

  const aosProps =
    index > 2
      ? {
          'data-aos': 'fade-up',
          'data-aos-duration': '400',
          'data-aos-once': 'true',
          'data-aos-anchor-placement': 'top-bottom'
        }
      : {}

  return (
    <div className='glass-post-item w-full' {...aosProps}>
      <div key={post.id} className='flex flex-col-reverse justify-between'>
        <div className='p-4 sm:p-6 lg:p-8 flex flex-col w-full'>
          {/* 标题 */}
          <SmartLink
            href={post?.href}
            className={`cursor-pointer text-xl sm:text-2xl font-semibold ${showPreview ? 'text-center' : ''} text-gray-800 dark:text-gray-100 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors`}>
            {siteConfig('POST_TITLE_ICON') && (
              <NotionIcon icon={post.pageIcon} />
            )}{' '}
            {post.title}
          </SmartLink>

          {/* 元信息 */}
          <div
            className={`flex mt-2 sm:mt-3 items-center ${showPreview ? 'justify-center' : 'justify-start'} flex-wrap text-gray-500 dark:text-gray-400 text-xs sm:text-sm gap-x-2 sm:gap-x-3 gap-y-1`}>
            {post.category && (
              <>
                <SmartLink
                  href={`/category/${post.category}`}
                  className='glass-link'>
                  <i className='mr-1 fas fa-folder' />
                  {post.category}
                </SmartLink>
                <span className='text-gray-300 dark:text-gray-600'>|</span>
              </>
            )}
            <SmartLink
              href={`/archive#${formatDateFmt(post?.publishDate, 'yyyy-MM')}`}
              className='glass-link'>
              {post.date?.start_date}
            </SmartLink>

            <TwikooCommentCount post={post} className='glass-link' />

            <div className='flex flex-wrap gap-1'>
              {post.tagItems?.map(tag => (
                <TagItemMini key={tag.name} tag={tag} />
              ))}
            </div>
          </div>

          {/* 摘要 */}
          {(!showPreview || showSummary) && !post.results && (
            <p className='mt-3 sm:mt-4 mb-8 sm:mb-10 text-gray-600 dark:text-gray-400 text-sm leading-7'>
              {post.summary}
            </p>
          )}

          {/* 搜索结果 */}
          {post.results && (
            <p className='line-clamp-4 mt-3 sm:mt-4 text-gray-600 dark:text-gray-400 text-sm leading-7'>
              {post.results.map((r, idx) => (
                <span key={idx}>{r}</span>
              ))}
            </p>
          )}

          {/* 预览 */}
          {showPreview && post?.blockMap && (
            <div className='overflow-ellipsis truncate'>
              <NotionPage post={post} />
            </div>
          )}

          {/* 阅读更多 */}
          <div className='text-right border-t pt-4 sm:pt-6 border-gray-200/50 dark:border-gray-700/50'>
            <SmartLink
              href={post?.href}
              className='glass-btn inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 text-sm'>
              {locale.COMMON.ARTICLE_DETAIL}
              <i className='fas fa-angle-right text-xs' />
            </SmartLink>
          </div>
        </div>

        {/* 封面图 */}
        {siteConfig('LIQUID_POST_LIST_COVER', null, CONFIG) &&
          post?.pageCoverThumbnail && (
            <SmartLink href={post?.href}>
              <div className='h-44 sm:h-56 w-full relative overflow-hidden rounded-t-2xl'>
                <LazyImage
                  className='w-full h-full object-cover hover:scale-105 transition-transform duration-500'
                  src={post?.pageCoverThumbnail}
                  alt={post.title}
                  loading='lazy'
                />
                <div className='absolute inset-0 bg-gradient-to-t from-white/20 to-transparent dark:from-black/20' />
              </div>
            </SmartLink>
          )}
      </div>
    </div>
  )
}

export default BlogPostCard