import { useGlobal } from '@/lib/global'
import SmartLink from '@/components/SmartLink'
import { useCallback, useEffect, useRef, useState } from 'react'
import Collapse from '@/components/Collapse'
import Logo from './Logo'
import { MenuList } from './MenuList'
import SearchDrawer from './SearchDrawer'
import TagGroups from './TagGroups'
import CategoryGroup from './CategoryGroup'
import CONFIG from '../config'
import { siteConfig } from '@/lib/config'
import { useRouter } from 'next/router'

const TopNav = (props) => {
  const { tags, currentTag, categories, currentCategory } = props
  const { locale } = useGlobal()
  const searchDrawer = useRef()
  const collapseRef = useRef(null)
  const router = useRouter()
  const rafRef = useRef(null)
  const navRef = useRef(null)
  const windowTopRef = useRef(0)
  const [isOpen, changeShow] = useState(false)

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

  const menuCollapseHide = useCallback(() => {
    changeShow(false)
  }, [])

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
    return () => {
      router.events.off('routeChangeComplete', menuCollapseHide)
    }
  }, [menuCollapseHide, router.events])

  const toggleMenuOpen = () => {
    changeShow(!isOpen)
  }

  const showSearchDrawer = () => {
    searchDrawer?.current?.show()
  }

  const searchDrawerSlot = (
    <>
      {categories && (
        <section className='mt-8'>
          <div className='text-sm flex flex-nowrap justify-between font-light px-2'>
            <div className='text-gray-600 dark:text-gray-200'>
              <i className='mr-2 fas fa-th-list' />
              {locale.COMMON.CATEGORY}
            </div>
            <SmartLink
              href='/category'
              className='glass-link text-sm'>
              {locale.COMMON.MORE} <i className='fas fa-angle-double-right' />
            </SmartLink>
          </div>
          <CategoryGroup currentCategory={currentCategory} categories={categories} />
        </section>
      )}

      {tags && (
        <section className='mt-4'>
          <div className='text-sm py-2 px-2 flex flex-nowrap justify-between font-light dark:text-gray-200'>
            <div className='text-gray-600 dark:text-gray-200'>
              <i className='mr-2 fas fa-tag' />
              {locale.COMMON.TAGS}
            </div>
            <SmartLink
              href='/tag'
              className='glass-link text-sm'>
              {locale.COMMON.MORE} <i className='fas fa-angle-double-right' />
            </SmartLink>
          </div>
          <div className='p-2'>
            <TagGroups tags={tags} currentTag={currentTag} />
          </div>
        </section>
      )}
    </>
  )

  return (
    <div id='top-nav' className='block lg:hidden'>
      <SearchDrawer cRef={searchDrawer} slot={searchDrawerSlot} />

      <div
        id='sticky-nav'
        className={`${siteConfig('LIQUID_NAV_TYPE', null, CONFIG) !== 'normal' ? 'fixed' : 'relative'} lg:relative w-full top-0 z-20 transition-transform duration-500`}>
        <div className='glass-nav w-full flex justify-between items-center px-4 py-3'>
          <div className='flex flex-none flex-grow-0'>
            <div onClick={toggleMenuOpen} className='w-8 cursor-pointer'>
              {isOpen ? (
                <i className='fas fa-times text-gray-700 dark:text-gray-300' />
              ) : (
                <i className='fas fa-bars text-gray-700 dark:text-gray-300' />
              )}
            </div>
          </div>

          <div className='flex'>
            <Logo {...props} />
          </div>

          <div className='mr-1 flex justify-end items-center text-sm space-x-4'>
            <div className='cursor-pointer' onClick={showSearchDrawer}>
              <i className='fas fa-search text-gray-600 dark:text-gray-400' />
            </div>
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

export default TopNav