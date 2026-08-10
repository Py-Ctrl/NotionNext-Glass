import { useEffect, useRef, useState, useMemo } from 'react'
import { useGlobal } from '@/lib/global'
import { useRouter } from 'next/router'
import { siteConfig } from '@/lib/config'
import CONFIG from '../config'
import { getWallpaper } from './liquidGlassWallpaper'

const BottomTabs = () => {
  const { isDarkMode, locale } = useGlobal()
  const router = useRouter()
  const containerRef = useRef(null)
  const [useWebGL, setUseWebGL] = useState(false)
  const isSettingStateRef = useRef(false)

  const tabs = useMemo(() => [
    { icon: 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z', label: locale.NAV?.HOME || '首页', href: '/', viewport: 24 },
    siteConfig('LIQUID_MENU_CATEGORY', null, CONFIG) && { icon: 'M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z', label: locale.COMMON.CATEGORY, href: '/category', viewport: 24 },
    siteConfig('LIQUID_MENU_TAG', null, CONFIG) && { icon: 'M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58.55 0 1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41 0-.55-.23-1.06-.59-1.42zM5.5 7C4.67 7 4 6.33 4 5.5S4.67 4 5.5 4 7 4.67 7 5.5 6.33 7 5.5 7z', label: locale.COMMON.TAGS, href: '/tag', viewport: 24 },
    siteConfig('LIQUID_MENU_ARCHIVE', null, CONFIG) && { icon: 'M20.54 5.23l-1.39-1.68C18.88 3.21 18.47 3 18 3H6c-.47 0-.88.21-1.16.55L3.46 5.23C3.17 5.57 3 6.02 3 6.5V19c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6.5c0-.48-.17-.93-.46-1.27zM5.12 5l.81-1h12l.94 1H5.12zM12 17.5L6.5 12H10v-2h4v2h3.5L12 17.5z', label: locale.COMMON.ARCHIVE || '归档', href: '/archive', viewport: 24 },
  ].filter(Boolean), [locale])

  const activeTab = useMemo(() => {
    if (router.asPath === '/') return 0
    let idx = 0
    tabs.forEach((t, i) => {
      if (t && router.asPath.startsWith(t.href) && t.href !== '/') idx = i
    })
    return idx
  }, [router.asPath, tabs])

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
    el.setAttribute('mode', 'single-bottom-tabs')
    el.setAttribute('wallpaper', getWallpaper(isDarkMode))
    if (isDarkMode) el.setAttribute('dark', '')
    el.style.cssText = 'width:100%;height:100%'
    container.appendChild(el)

    let retries = 5
    let retryTimer = null

    const trySetTabs = () => {
      if (typeof el.setTabs === 'function') {
        el.setTabs([tabs.map(t => ({
          icon: t.icon,
          label: t.label,
          viewport: t.viewport
        }))])
        isSettingStateRef.current = true
        if (typeof el.setState === 'function') {
          el.setState({ selectedTab: activeTab })
        }
        setTimeout(() => { isSettingStateRef.current = false }, 200)
      } else if (retries > 0) {
        retries--
        retryTimer = setTimeout(trySetTabs, 100)
      }
    }
    requestAnimationFrame(trySetTabs)

    const handleStateChange = (e) => {
      if (isSettingStateRef.current) return
      const idx = e.detail?.selectedTab
      if (typeof idx === 'number' && idx >= 0 && tabs[idx]) {
        router.push(tabs[idx].href)
      }
    }
    document.addEventListener('lg-statechange', handleStateChange)

    return () => {
      clearTimeout(retryTimer)
      document.removeEventListener('lg-statechange', handleStateChange)
      if (container.contains(el)) container.removeChild(el)
    }
  }, [useWebGL, isDarkMode, activeTab, tabs, router])

  if (!useWebGL) {
    return (
      <nav className='fixed bottom-0 left-0 right-0 z-30 glass-nav'>
        <div className='flex justify-around items-center max-w-md mx-auto py-2'>
          {tabs.map((tab, idx) => (
            <button
              key={idx}
              onClick={() => router.push(tab.href)}
              className={`flex flex-col items-center gap-1 px-3 py-1 text-xs transition-colors ${
                activeTab === idx
                  ? 'text-indigo-500'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              <svg className='w-5 h-5' viewBox='0 0 24 24' fill='currentColor'>
                <path d={tab.icon} />
              </svg>
              {tab.label}
            </button>
          ))}
        </div>
      </nav>
    )
  }

  return (
    <nav className='fixed bottom-4 left-1/2 -translate-x-1/2 z-30 w-[calc(100%-2rem)] max-w-sm'>
      <div
        ref={containerRef}
        className='rounded-3xl overflow-hidden'
        style={{ height: '72px', background: isDarkMode ? '#000' : '#fff' }}
      />
    </nav>
  )
}

export default BottomTabs
