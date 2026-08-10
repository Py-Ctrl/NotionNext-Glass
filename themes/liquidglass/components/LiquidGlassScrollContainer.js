import { useEffect, useRef, useState } from 'react'
import { useGlobal } from '@/lib/global'
import { useRouter } from 'next/router'
import { getGradientWallpaper } from './liquidGlassWallpaper'
import SmartLink from '@/components/SmartLink'

const LiquidGlassScrollContainer = ({ items = [], height = 300, onLinkTap }) => {
  const { isDarkMode } = useGlobal()
  const router = useRouter()
  const containerRef = useRef(null)
  const elRef = useRef(null)
  const [useWebGL, setUseWebGL] = useState(false)

  const itemsKey = JSON.stringify(items)
  const itemsRef = useRef(items)
  itemsRef.current = items

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
    el.setAttribute('wallpaper', getGradientWallpaper(isDarkMode))
    if (isDarkMode) el.setAttribute('dark', '')
    el.style.cssText = 'width:100%;height:100%'
    container.appendChild(el)
    elRef.current = el

    let retries = 5
    let retryTimer = null

    const trySetScroll = () => {
      if (typeof el.setScroll === 'function') {
        el.setScroll(itemsRef.current.map(item => ({
          title: item.title,
          subtitle: item.subtitle,
          ...(item.link ? { link: item.link } : {})
        })))
      } else if (retries > 0) {
        retries--
        retryTimer = setTimeout(trySetScroll, 100)
      }
    }
    requestAnimationFrame(trySetScroll)

    const handleLinkTap = (e) => {
      const href = e.detail?.href
      if (!href) return
      const matched = itemsRef.current.find(item => item.link?.href === href)
      if (!matched) return
      if (onLinkTap) {
        onLinkTap(href)
      } else {
        router.push(href)
      }
    }
    document.addEventListener('lg-linktap', handleLinkTap)

    return () => {
      clearTimeout(retryTimer)
      document.removeEventListener('lg-linktap', handleLinkTap)
      if (container.contains(el)) container.removeChild(el)
      elRef.current = null
    }
  }, [useWebGL, isDarkMode, itemsKey])

  if (!useWebGL) {
    return (
      <div
        className='glass-card overflow-y-auto rounded-2xl p-2'
        style={{ height: `${height}px` }}
      >
        <div className='space-y-2'>
          {items.map((item, idx) => (
            <div key={idx} className='glass-post-item p-3 rounded-xl'>
              <div className='text-sm font-medium text-gray-800 dark:text-gray-200'>
                {item.title}
              </div>
              {item.subtitle && (
                <div className='text-xs text-gray-500 dark:text-gray-400 mt-1'>
                  {item.subtitle}
                </div>
              )}
              {item.link && (
                <SmartLink href={item.link.href} className='glass-link text-xs mt-2 inline-block'>
                  {item.link.text}
                </SmartLink>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className='rounded-2xl overflow-hidden'
      style={{ height: `${height}px`, background: isDarkMode ? '#0a0a1a' : '#eef2ff' }}
    />
  )
}

export default LiquidGlassScrollContainer
