import { useGlobal } from '@/lib/global'
import SmartLink from '@/components/SmartLink'
import LazyImage from '@/components/LazyImage'
import { siteConfig } from '@/lib/config'
import { useCallback, useEffect, useRef, useState } from 'react'
import Collapse from '@/components/Collapse'
import { MenuList } from './MenuList'
import SearchDrawer from './SearchDrawer'
import CONFIG from '../config'
import { useRouter } from 'next/router'

const TopNav = (props) => {
  const { tags, currentTag, categories, currentCategory, siteInfo, searchModal } = props
  const { locale } = useGlobal()
  const searchDrawer = useRef()
  const collapseRef = useRef(null)
  const router = useRouter()
  const rafRef = useRef(null)
  const navRef = useRef(null)
  const windowTopRef = useRef(0)
  const [isOpen, changeShow] = useState(false)
  const searchInputRef = useRef(null)

  const scrollTrigger = useCallback(() => {
    if (rafRef.current) return
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null
      const scrollS = window.scrollY
      if (!navRef.current) {
        navRef.current = document.querySelector('#sticky-nav')
      }
      if (scrollS >= windowTopRef.current && scrollS > 10) {
        navRef.current && navRef.current.classList.replace('top-0', '-top-40')
        windowTopRef.current = scrollS
      } else {
        navRef.current && navRef.current.classList.replace('-top-40', 'top-0')
        windowTopRef.current = scrollS
      }
    })
  }, [])

  const menuCollapseHide = useCallback(() => changeShow(false), [])

  useEffect(() => {
    if (siteConfig('LIQUID_NAV_TYPE', null, CONFIG) === 'autoCollapse') {
      navRef.current = document.querySelector('#sticky-nav')
      scrollTrigger()
      window.addEventListener('scroll', scrollTrigger, { passive: true })
    }
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      if (siteConfig('LIQUID_NAV_TYPE', null, CONFIG) === 'autoCollapse') {
        window.removeEventListener('scroll', scrollTrigger)
      }
    }
  }, [scrollTrigger])

  useEffect(() => {
    router.events.on('routeChangeComplete', menuCollapseHide)
    return () => router.events.off('routeChangeComplete', menuCollapseHide)
  }, [menuCollapseHide, router.events])

  const toggleMenuOpen = () => changeShow(!isOpen)

  const handleMobileSearch = (key) => {
    if (siteConfig('ALGOLIA_APP_ID') && searchModal?.current) {
      searchDrawer?.current?.hide()
      searchModal.current.openSearch()
      return
    }
    if (key && key !== '') {
      searchDrawer?.current?.hide()
      router.push({ pathname: '/search/' + key })
    }
  }

  return (
    <div id='top-nav' className='block lg:hidden'>
      <SearchDrawer cRef={searchDrawer} slot={
        <>
          {/* 搜索框 */}
          <div className='glass-search flex w-full items-center mb-4'>
            <i className='fas fa-search text-gray-400 dark:text-gray-500 ml-4 text-sm' />
            <input
              ref={searchInputRef}
              type='text'
              placeholder={locale.SEARCH?.ARTICLES || '搜索文章'}
              className='outline-none w-full text-sm px-3 py-2.5 bg-transparent text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500'
              onKeyUp={(e) => {
                if (e.keyCode === 13) {
                  handleMobileSearch(e.target.value)
                }
              }}
              onFocus={() => {
                if (siteConfig('ALGOLIA_APP_ID') && searchModal?.current) {
                  searchDrawer?.current?.hide()
                  searchModal.current.openSearch()
                }
              }}
            />
          </div>
          {categories && (
            <section className='mt-2'>
              <div className='text-sm font-medium text-gray-600 dark:text-gray-200 mb-2'>
                <i className='mr-2 fas fa-th-list' />
                {locale.COMMON.CATEGORY}
              </div>
              <CategoryGroupWrapper categories={categories} currentCategory={currentCategory} />
            </section>
          )}
          {tags && (
            <section className='mt-4'>
              <div className='text-sm font-medium text-gray-600 dark:text-gray-200 mb-2'>
                <i className='mr-2 fas fa-tag' />
                {locale.COMMON.TAGS}
              </div>
              <TagGroupsWrapper tags={tags} currentTag={currentTag} />
            </section>
          )}
        </>
      } />

      <div
        id='sticky-nav'
        className={`${siteConfig('LIQUID_NAV_TYPE', null, CONFIG) !== 'normal' ? 'fixed' : 'relative'} lg:relative w-full top-0 z-30 transition-transform duration-500`}>
        <div className='glass-nav w-full flex justify-between items-center px-4 py-2.5'>
          {/* 左侧菜单按钮 */}
          <div onClick={toggleMenuOpen} className='w-8 h-8 flex items-center justify-center cursor-pointer'>
            {isOpen ? (
              <i className='fas fa-times text-gray-700 dark:text-gray-300' />
            ) : (
              <i className='fas fa-bars text-gray-700 dark:text-gray-300' />
            )}
          </div>

          {/* 中间 Logo + 头像 */}
          <div className='flex items-center space-x-2'>
            <div className='w-7 h-7 rounded-full overflow-hidden ring-1 ring-white/30 dark:ring-white/10'>
              <LazyImage
                priority={true}
                src={siteInfo?.icon}
                className='rounded-full w-full h-full object-cover'
                width={28}
                height={28}
                alt={siteConfig('AUTHOR')}
              />
            </div>
            <span className='text-sm font-semibold text-gray-800 dark:text-gray-200 truncate max-w-[120px]'>
              {siteInfo?.title || siteConfig('TITLE')}
            </span>
          </div>

          {/* 右侧搜索 */}
          <div className='w-8 h-8 flex items-center justify-center cursor-pointer'
               onClick={() => {
                 if (siteConfig('ALGOLIA_APP_ID') && searchModal?.current) {
                   searchModal.current.openSearch()
                 } else {
                   searchDrawer?.current?.show()
                 }
               }}>
            <i className='fas fa-search text-gray-600 dark:text-gray-400' />
          </div>
        </div>

        <Collapse collapseRef={collapseRef} type='vertical' isOpen={isOpen}>
          <div className='glass-card rounded-t-none border-t-0'>
            <MenuList
              onHeightChange={(param) => collapseRef.current?.updateCollapseHeight(param)}
              {...props}
              from='top'
            />
          </div>
        </Collapse>
      </div>
    </div>
  )
}

// 内联组件避免循环依赖
import CategoryGroup from './CategoryGroup'
import TagGroups from './TagGroups'

const CategoryGroupWrapper = ({ categories, currentCategory }) => (
  <CategoryGroup categories={categories} currentCategory={currentCategory} />
)
const TagGroupsWrapper = ({ tags, currentTag }) => (
  <TagGroups tags={tags} currentTag={currentTag} />
)

export default TopNav