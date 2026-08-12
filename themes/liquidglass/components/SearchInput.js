import { useRouter } from 'next/router'
import { useGlobal } from '@/lib/global'
import { useEffect, useRef, useState } from 'react'
import { siteConfig } from '@/lib/config'
import CONFIG from '../config'

const SearchInput = ({ currentTag, keyword, onSearch, compact = false, searchModal }) => {
  const { locale, isDarkMode } = useGlobal()
  const router = useRouter()
  const containerRef = useRef(null)
  const [useWebGL, setUseWebGL] = useState(false)
  const fallbackRef = useRef(null)
  const [showClean, setShowClean] = useState(false)
  const webglRef = useRef(null)

  useEffect(() => {
    if (!siteConfig('LIQUID_GLASS_WEBGL_ENABLED', null, CONFIG) || compact) return

    if (window.__liquidGlassLoaded) {
      setUseWebGL(true)
    } else {
      const handler = () => setUseWebGL(true)
      window.addEventListener('liquid-glass-ready', handler)
      const timer = setTimeout(() => {
        if (!window.__liquidGlassLoaded) setUseWebGL(false)
      }, 5000)
      return () => {
        window.removeEventListener('liquid-glass-ready', handler)
        clearTimeout(timer)
      }
    }
  }, [])

  const doSearch = (key) => {
    if (siteConfig('ALGOLIA_APP_ID') && searchModal?.current) {
      searchModal.current.openSearch()
      return
    }
    if (onSearch) {
      onSearch(key)
      return
    }
    if (key && key !== '') {
      router.push({ pathname: '/search/' + key })
    } else {
      router.push({ pathname: '/' })
    }
  }

  const getSearchHeight = () => {
    if (typeof window === 'undefined') return 300
    const w = window.innerWidth
    if (w < 640) return 200
    if (w < 1024) return 260
    return 300
  }

  useEffect(() => {
    if (!useWebGL || !containerRef.current) return

    const wrapper = containerRef.current
    wrapper.innerHTML = ''

    const height = getSearchHeight()

    let el
    try {
      el = document.createElement('liquid-glass-search')
      el.style.cssText = `display:block;width:100%;height:${height}px`
      wrapper.appendChild(el)

      el.setAttribute('wallpaper', 'gradient')
      if (isDarkMode) el.setAttribute('dark', '')

      webglRef.current = el

      const placeholder = currentTag
        ? `${locale.SEARCH.TAGS} #${currentTag}`
        : `${locale.SEARCH.ARTICLES}`
      el.setAttribute('placeholder', placeholder)
      el.setAttribute('hint', '')
    } catch (e) {
      // WebGL 搜索框初始化失败，降级为普通搜索框
      console.warn('[SearchInput] liquid-glass-search init failed, fallback:', e)
      setUseWebGL(false)
      return
    }

    const handleSubmit = (e) => {
      const text = e.detail?.text || el.getValue?.() || ''
      if (text) doSearch(text)
    }
    const handleClose = () => {}

    el.addEventListener('lg-search-submit', handleSubmit)
    el.addEventListener('lg-search-close', handleClose)

    const handleResize = () => {
      if (!webglRef.current) return
      const newHeight = getSearchHeight()
      webglRef.current.style.height = `${newHeight}px`
    }
    window.addEventListener('resize', handleResize)

    return () => {
      el.removeEventListener('lg-search-submit', handleSubmit)
      el.removeEventListener('lg-search-close', handleClose)
      window.removeEventListener('resize', handleResize)
      if (wrapper.contains(el)) {
        wrapper.removeChild(el)
      }
    }
  }, [useWebGL, currentTag, isDarkMode])

  const handleFallbackKeyUp = (e) => {
    if (e.keyCode === 13) {
      doSearch(fallbackRef.current?.value || '')
    } else if (e.keyCode === 27) {
      if (fallbackRef.current) fallbackRef.current.value = ''
      setShowClean(false)
    }
  }

  const placeholder = currentTag
    ? `${locale.SEARCH.TAGS} #${currentTag}`
    : `${locale.SEARCH.ARTICLES}`

  return (
    <div className='w-full'>
      {useWebGL ? (
        <div
          ref={containerRef}
          className='liquid-glass-search-wrapper w-full cursor-pointer'
          style={{ borderRadius: '20px', overflow: 'hidden' }}
          onClick={() => {
            if (siteConfig('ALGOLIA_APP_ID') && searchModal?.current) {
              searchModal.current.openSearch()
            }
          }}
        />
      ) : (
        <div ref={containerRef} className='glass-search flex w-full items-center'>
          <i className='fas fa-search text-gray-400 dark:text-gray-500 ml-4 text-sm' />
          <input
            ref={fallbackRef}
            type='text'
            placeholder={placeholder}
            className='outline-none w-full text-sm px-3 py-2.5 bg-transparent text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500'
            onKeyUp={handleFallbackKeyUp}
            onFocus={() => {
              if (siteConfig('ALGOLIA_APP_ID') && searchModal?.current) {
                searchModal.current.openSearch()
              }
            }}
            onChange={(e) => setShowClean(!!e.target.value)}
            defaultValue={keyword || ''}
          />
          {showClean && (
            <i
              className='fas fa-times text-gray-400 dark:text-gray-500 mr-4 cursor-pointer hover:text-gray-600 dark:hover:text-gray-300'
              onClick={() => {
                if (fallbackRef.current) {
                  fallbackRef.current.value = ''
                  setShowClean(false)
                }
              }}
            />
          )}
        </div>
      )}
    </div>
  )
}

export default SearchInput
