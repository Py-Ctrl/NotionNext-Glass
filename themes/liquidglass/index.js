import replaceSearchResult from '@/components/Mark'
import { siteConfig } from '@/lib/config'
import { useGlobal } from '@/lib/global'
import { isBrowser } from '@/lib/utils'
import dynamic from 'next/dynamic'
import SmartLink from '@/components/SmartLink'
import { useRouter } from 'next/router'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState
} from 'react'
import ArticleDetail from './components/ArticleDetail'
import { ArticleLock } from './components/ArticleLock'
import BlogListBar from './components/BlogListBar'
import BlogPostArchive from './components/BlogPostArchive'
import BlogPostListPage from './components/BlogPostListPage'
import BlogPostListScroll from './components/BlogPostListScroll'
import BottomTabs from './components/BottomTabs'
import FloatDarkModeButton from './components/FloatDarkModeButton'
import Footer from './components/Footer'
import JumpToBottomButton from './components/JumpToBottomButton'
import JumpToTopButton from './components/JumpToTopButton'
import SideAreaLeft from './components/SideAreaLeft'
import SideAreaRight from './components/SideAreaRight'
import StickyBar from './components/StickyBar'
import TagItem from './components/TagItem'
import TocDrawer from './components/TocDrawer'
import TocDrawerButton from './components/TocDrawerButton'
import TopNav from './components/TopNav'
import CONFIG from './config'
import { Style } from './style'
import LiquidGlassScript from './components/LiquidGlassScript'
import LoadingCover from '@/components/LoadingCover'

const AlgoliaSearchModal = dynamic(
  () => import('@/components/AlgoliaSearchModal'),
  { ssr: false }
)

const ThemeGlobalLiquidGlass = createContext()
export const useLiquidGlassGlobal = () => useContext(ThemeGlobalLiquidGlass)

const LayoutBase = props => {
  const { children, headerSlot, rightAreaSlot, post } = props
  const router = useRouter()
  const targetRef = useRef(null)
  const floatButtonGroup = useRef(null)
  const [showRightFloat, switchShow] = useState(false)
  const [percent, changePercent] = useState(0)
  const showRightFloatRef = useRef(showRightFloat)
  const percentRef = useRef(percent)
  const rafRef = useRef(null)

  useEffect(() => {
    showRightFloatRef.current = showRightFloat
  }, [showRightFloat])

  useEffect(() => {
    percentRef.current = percent
  }, [percent])

  const scrollListener = useCallback(() => {
    if (rafRef.current) return
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null
      const targetWrapper = document.getElementById('wrapper')
      const clientHeight = targetWrapper?.clientHeight
      const fullHeight = clientHeight - window.innerHeight
      if (!targetWrapper || !fullHeight || fullHeight <= 0) return

      const scrollY = window.pageYOffset
      let per = parseFloat(((scrollY / fullHeight) * 100).toFixed(0))
      if (per > 100) per = 100
      if (per < 0) per = 0
      const shouldShow = scrollY > 100 && per > 0

      if (shouldShow !== showRightFloatRef.current) {
        showRightFloatRef.current = shouldShow
        switchShow(shouldShow)
      }
      if (per !== percentRef.current) {
        percentRef.current = per
        changePercent(per)
      }
    })
  }, [changePercent, switchShow])

  useEffect(() => {
    const fb = document.getElementsByClassName('fb-customerchat')
    if (fb.length === 0) {
      floatButtonGroup?.current?.classList.replace('bottom-24', 'bottom-12')
    } else {
      floatButtonGroup?.current?.classList.replace('bottom-12', 'bottom-24')
    }
    document.addEventListener('scroll', scrollListener, { passive: true })
    return () => {
      document.removeEventListener('scroll', scrollListener)
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
    }
  }, [scrollListener])

  const drawerRight = useRef(null)
  const floatSlot = (
    <div className='block lg:hidden'>
      <TocDrawerButton
        onClick={() => {
          drawerRight?.current?.handleSwitchVisible()
        }}
      />
    </div>
  )

  const tocRef = isBrowser ? document.getElementById('article-wrapper') : null
  const searchModal = useRef(null)

  return (
    <ThemeGlobalLiquidGlass.Provider value={{ searchModal }}>
      <div
        id='theme-liquidglass'
        className={`${siteConfig('FONT_STYLE')} dark:bg-black min-h-screen scroll-smooth`}>
        <Style />
        <LiquidGlassScript />
        <LoadingCover />

        {/* 移动端顶部导航 */}
        <TopNav {...props} />

        <AlgoliaSearchModal cRef={searchModal} {...props} />

        <>{headerSlot}</>

        {/* 顶部渐变装饰线 */}
        <div className='h-0.5 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 hidden lg:block' />

        {/* 主区 — 自适应三栏布局 */}
        <main
          id='wrapper'
          className={
            (JSON.parse(siteConfig('LAYOUT_SIDEBAR_REVERSE'))
              ? 'flex-row-reverse'
              : '') + ' liquidglass relative flex justify-center flex-1 pb-28 lg:pb-28 pl-1 pr-2 sm:pl-2 sm:pr-4 lg:pl-3 lg:pr-6'
          }>
          {/* 左侧栏 */}
          <SideAreaLeft targetRef={targetRef} {...props} />

          {/* 中央内容 */}
          <section
            id='container-inner'
            className={`${siteConfig('LIQUID_NAV_TYPE', null, CONFIG) !== 'normal' ? 'mt-20 lg:mt-0' : ''} w-full lg:max-w-2xl xl:max-w-3xl flex-grow min-h-screen relative z-10 px-1 sm:px-2`}
            ref={targetRef}>
            <div className='glass-transition' key={router.asPath}>
              {children}
            </div>
          </section>

          {/* 右侧栏 */}
          {siteConfig('LIQUID_RIGHT_BAR', null, CONFIG) && (
            <SideAreaRight
              targetRef={targetRef}
              slot={rightAreaSlot}
              {...props}
              searchModal={searchModal}
            />
          )}
        </main>

        {/* 悬浮目录 */}
        {post && (
          <div className='block lg:hidden'>
            <TocDrawer post={post} cRef={drawerRight} targetRef={tocRef} />
          </div>
        )}

        {/* 右下角悬浮按钮组 */}
        <div
          ref={floatButtonGroup}
          className='right-4 sm:right-8 bottom-12 lg:right-2 fixed justify-end z-20'>
          <div
            className={
              (showRightFloat ? 'animate__animated ' : 'hidden') +
              ' animate__fadeInUp rounded-2xl p-1.5 justify-center duration-500 animate__faster flex space-x-2 items-center'
            }>
            <JumpToTopButton percent={percent} />
            <JumpToBottomButton />
            <FloatDarkModeButton />
            {floatSlot}
          </div>
        </div>

        {/* 底部标签栏 */}
        <BottomTabs {...props} />

        {/* 页脚 */}
        <Footer title={siteConfig('TITLE')} />
      </div>
    </ThemeGlobalLiquidGlass.Provider>
  )
}

const LayoutIndex = props => {
  return (
    <>
      <BlogListBar {...props} />
      {siteConfig('POST_LIST_STYLE') !== 'page' ? (
        <BlogPostListScroll {...props} showSummary={true} />
      ) : (
        <BlogPostListPage {...props} />
      )}
    </>
  )
}

const LayoutPostList = props => {
  return (
    <>
      <BlogListBar {...props} />
      {siteConfig('POST_LIST_STYLE') !== 'page' ? (
        <BlogPostListScroll {...props} showSummary={true} />
      ) : (
        <BlogPostListPage {...props} />
      )}
    </>
  )
}

const LayoutSearch = props => {
  const { locale } = useGlobal()
  const { posts, keyword } = props

  useEffect(() => {
    if (isBrowser) {
      replaceSearchResult({
        doms: document.getElementById('posts-wrapper'),
        search: keyword,
        target: {
          element: 'span',
          className: 'text-indigo-500 border-b border-dashed'
        }
      })
    }
  }, [])

  return (
    <>
      <StickyBar>
        <div className='p-3 sm:p-4 dark:text-gray-200 text-sm'>
          <i className='mr-1 fas fa-search' /> {posts?.length}{' '}
          {locale.COMMON.RESULT_OF_SEARCH}
        </div>
      </StickyBar>
      <div className='md:mt-5'>
        {siteConfig('POST_LIST_STYLE') !== 'page' ? (
          <BlogPostListScroll {...props} showSummary={true} />
        ) : (
          <BlogPostListPage {...props} />
        )}
      </div>
    </>
  )
}

const Layout404 = props => {
  const router = useRouter()
  useEffect(() => {
    setTimeout(() => {
      const article = isBrowser && document.getElementById('article-wrapper')
      if (!article) {
        router.push('/').then(() => {})
      }
    }, 3000)
  }, [])

  return (
    <div className='min-h-screen flex items-center justify-center px-4'>
      <div className='glass-card p-8 sm:p-12 text-center'>
        <div className='text-5xl sm:text-6xl mb-4 opacity-20'>
          <i className='fas fa-ghost' />
        </div>
        <h2 className='text-lg sm:text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2'>
          <i className='mr-2 fas fa-spinner animate-spin' />
          404
        </h2>
        <p className='text-sm text-gray-500 dark:text-gray-400'>
          页面无法加载，即将返回首页
        </p>
      </div>
    </div>
  )
}

const LayoutArchive = props => {
  const { archivePosts } = props
  return (
    <div className='mb-10 pb-20 p-2 sm:p-6 md:p-12 min-h-full'>
      {Object.keys(archivePosts).map(archiveTitle => (
        <BlogPostArchive
          key={archiveTitle}
          posts={archivePosts[archiveTitle]}
          archiveTitle={archiveTitle}
        />
      ))}
    </div>
  )
}

const LayoutSlug = props => {
  const { post, lock, validPassword } = props
  const router = useRouter()
  const waiting404 = siteConfig('POST_WAITING_TIME_FOR_404') * 1000

  useEffect(() => {
    if (!post) {
      setTimeout(() => {
        if (isBrowser) {
          const article = document.querySelector('#article-wrapper #notion-article')
          if (!article) {
            router.push('/404').then(() => {
              console.warn('找不到页面', router.asPath)
            })
          }
        }
      }, waiting404)
    }
  }, [post])

  return (
    <>
      {post && !lock && <ArticleDetail {...props} />}
      {post && lock && <ArticleLock validPassword={validPassword} />}
    </>
  )
}

const LayoutCategoryIndex = props => {
  const { allPosts, categoryOptions } = props
  const { locale } = useGlobal()

  return (
    <div className='glass-card p-4 sm:p-8'>
      <div className='dark:text-gray-200 mb-5 text-sm sm:text-base'>
        <i className='mr-4 fas fa-th-list' />
        {locale.COMMON.CATEGORY}:
      </div>
      <div id='category-list' className='flex flex-wrap gap-2'>
        {categoryOptions?.map(category => (
          <SmartLink
            key={category.name}
            href={`/category/${category.name}`}
            className='glass-tag inline-block'>
            <i className='mr-2 fas fa-folder' />
            {category.name} ({category.count})
          </SmartLink>
        ))}
      </div>
    </div>
  )
}

const LayoutTagIndex = props => {
  const { tagOptions } = props
  const { locale } = useGlobal()

  return (
    <div className='glass-card p-4 sm:p-8'>
      <div className='dark:text-gray-200 mb-5 text-sm sm:text-base'>
        <i className='fas fa-tags mr-4' />
        {locale.COMMON.TAGS}:
      </div>
      <div id='tags-list' className='flex flex-wrap gap-2'>
        {tagOptions.map(tag => (
          <TagItem key={tag.name} tag={tag} />
        ))}
      </div>
    </div>
  )
}

export {
  Layout404,
  LayoutArchive,
  LayoutBase,
  LayoutCategoryIndex,
  LayoutIndex,
  LayoutPostList,
  LayoutSearch,
  LayoutSlug,
  LayoutTagIndex,
  CONFIG as THEME_CONFIG
}