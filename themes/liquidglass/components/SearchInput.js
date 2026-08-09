import { useRouter } from 'next/router'
import { useGlobal } from '@/lib/global'
import { useEffect, useRef, useState } from 'react'
import { siteConfig } from '@/lib/config'
import CONFIG from '../config'

const SearchInput = ({ currentTag, keyword, onSearch, compact = false }) => {
  const { locale } = useGlobal()
  const router = useRouter()
  const containerRef = useRef(null)
  const [useWebGL, setUseWebGL] = useState(false)
  const fallbackRef = useRef(null)
  const [showClean, setShowClean] = useState(false)
  const webglRef = useRef(null)

  // 检测 liquid-glass.js 是否已加载
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

  // 搜索处理
  const doSearch = (key) => {
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

  // 获取响应式高度
  const getSearchHeight = () => {
    if (typeof window === 'undefined') return 300
    const w = window.innerWidth
    if (w < 640) return 200
    if (w < 1024) return 260
    return 300
  }

  // WebGL 搜索框：创建元素并绑定事件
  useEffect(() => {
    if (!useWebGL || !containerRef.current) return

    const wrapper = containerRef.current
    wrapper.innerHTML = ''

    const height = getSearchHeight()

    // 按文档要求：先 append 进 DOM，再设置属性
    const el = document.createElement('liquid-glass-search')
    el.style.cssText = `display:block;width:100%;height:${height}px`
    wrapper.appendChild(el)

    // 设置壁纸避免画布默认黑色
    el.setAttribute('wallpaper', 'gradient')

    webglRef.current = el

    const placeholder = currentTag
      ? `${locale.SEARCH.TAGS} #${currentTag}`
      : `${locale.SEARCH.ARTICLES}`
    el.setAttribute('placeholder', placeholder)
    el.setAttribute('hint', '')

    const handleSubmit = (e) => {
      const text = e.detail?.text || el.getValue?.() || ''
      if (text) doSearch(text)
    }
    const handleClose = () => {}

    el.addEventListener('lg-search-submit', handleSubmit)
    el.addEventListener('lg-search-close', handleClose)

    // 窗口大小变化时重建
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
  }, [useWebGL, currentTag])

  // 回退搜索框处理
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
          className='liquid-glass-search-wrapper w-full'
          style={{ borderRadius: '20px', overflow: 'hidden' }}
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
