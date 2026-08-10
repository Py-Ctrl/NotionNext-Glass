import { useEffect, useRef, useState } from 'react'
import { useGlobal } from '@/lib/global'
import { useRouter } from 'next/router'
import { getWallpaper } from './liquidGlassWallpaper'

const LiquidGlassScrollContainer = ({
  items = [],
  onLinkTap,
  width = '100%',
  height = '400px',
  className = '',
  fallbackClassName = ''
}) => {
  const { isDarkMode } = useGlobal()
  const router = useRouter()
  const routerRef = useRef(router)
  const containerRef = useRef(null)
  const [useWebGL, setUseWebGL] = useState(false)
  const [renderFailed, setRenderFailed] = useState(false)
  const onLinkTapRef = useRef(onLinkTap)

  useEffect(() => {
    routerRef.current = router
  }, [router])

  useEffect(() => {
    onLinkTapRef.current = onLinkTap
  }, [onLinkTap])

  useEffect(() => {
    if (!window.__liquidGlassLoaded) {
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
    setUseWebGL(true)
  }, [])

  useEffect(() => {
    if (!useWebGL || !containerRef.current) return

    const container = containerRef.current
    container.innerHTML = ''

    const el = document.createElement('liquid-glass')
    el.setAttribute('mode', 'scroll-container')
    el.setAttribute('wallpaper', getWallpaper(isDarkMode))
    if (isDarkMode) el.setAttribute('dark', '')
    el.style.cssText = 'width:100%;height:100%'
    container.appendChild(el)

    let retries = 5
    let retryTimer = null
    let failed = false

    const trySetScroll = () => {
      if (failed) return
      if (typeof el.setScroll === 'function') {
        el.setScroll(items)
      } else if (retries > 0) {
        retries--
        retryTimer = setTimeout(trySetScroll, 100)
      } else {
        failed = true
        setRenderFailed(true)
      }
    }
    requestAnimationFrame(trySetScroll)

    const itemHrefs = new Set(items.map(i => i.link?.href).filter(Boolean))

    const handleLinkTap = (e) => {
      const { index, href } = e.detail || {}
      if (itemHrefs.size > 0 && !itemHrefs.has(href)) return
      if (onLinkTapRef.current) {
        onLinkTapRef.current(index, href)
      } else if (href && href !== '#') {
        routerRef.current.push(href)
      }
    }
    document.addEventListener('lg-linktap', handleLinkTap)

    return () => {
      clearTimeout(retryTimer)
      document.removeEventListener('lg-linktap', handleLinkTap)
      if (container.contains(el)) container.removeChild(el)
    }
  }, [useWebGL, items, isDarkMode])

  const showFallback = !useWebGL || renderFailed

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        width,
        height,
        position: 'relative',
        borderRadius: 'inherit',
        overflow: 'hidden',
        background: isDarkMode ? '#000' : '#fff'
      }}
    >
      {showFallback && (
        <div className={`w-full h-full overflow-y-auto ${fallbackClassName}`}>
          {items.map((item, idx) => (
            <div
              key={idx}
              className='glass-card mx-3 my-2 p-4 rounded-2xl'
              onClick={() => {
                if (onLinkTap) {
                  onLinkTap(idx, item.link?.href)
                } else if (item.link?.href && item.link.href !== '#') {
                  routerRef.current.push(item.link.href)
                }
              }}
            >
              <div className='text-sm font-medium text-gray-800 dark:text-gray-200'>
                {item.title}
              </div>
              {item.subtitle && (
                <div className='text-xs text-gray-500 dark:text-gray-400 mt-1'>
                  {item.subtitle}
                </div>
              )}
              {item.link?.text && (
                <div className='text-xs text-indigo-500 mt-2'>
                  {item.link.text}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default LiquidGlassScrollContainer
