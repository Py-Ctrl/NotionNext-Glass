import { useEffect, useRef, useState, useMemo } from 'react'
import { useGlobal } from '@/lib/global'
import { useRouter } from 'next/router'
import { siteConfig } from '@/lib/config'
import CONFIG from '../config'
import SmartLink from '@/components/SmartLink'
import { getWallpaper } from './liquidGlassWallpaper'

const ICON_MAP = {
  'fa-house': 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z',
  'fa-home': 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z',
  'fa-th-list': 'M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z',
  'fa-folder': 'M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z',
  'fa-tag': 'M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58.55 0 1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41 0-.55-.23-1.06-.59-1.42z',
  'fa-tags': 'M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58.55 0 1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41 0-.55-.23-1.06-.59-1.42z',
  'fa-archive': 'M20.54 5.23l-1.39-1.68C18.88 3.21 18.47 3 18 3H6c-.47 0-.88.21-1.16.55L3.46 5.23C3.17 5.57 3 6.02 3 6.5V19c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6.5c0-.48-.17-.93-.46-1.27z',
  'fa-search': 'M15.5 14h-.79l-.28-.27a6.5 6.5 0 1 0-.7.7l.27.28v.79l5 4.99L20.49 19zm-6 0A4.5 4.5 0 1 1 14 9.5 4.5 4.5 0 0 1 9.5 14z',
  'fa-user': 'M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5zm0 2c-3.33 0-10 1.67-10 5v3h20v-3c0-3.33-6.67-5-10-5z',
  'fa-book': 'M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z',
  'fa-link': 'M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z',
  'fa-globe': 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93z'
}

const DEFAULT_ICON = 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5'

const getIconPath = (iconClass) => {
  if (!iconClass) return DEFAULT_ICON
  const parts = iconClass.split(' ')
  for (const part of parts) {
    const name = part.replace(/^fa-(r|l|b|s|solid|regular|brands)-/, '').replace(/^fa-/, '')
    if (ICON_MAP[name]) return ICON_MAP[name]
  }
  return DEFAULT_ICON
}

const BottomTabs = (props) => {
  const { isDarkMode, locale } = useGlobal()
  const { customMenu, customNav } = props
  const router = useRouter()
  const containerRef = useRef(null)
  const [useWebGL, setUseWebGL] = useState(false)
  const isSettingStateRef = useRef(false)
  const [subMenuOpen, setSubMenuOpen] = useState(null)
  const subMenuRef = useRef(null)

  const menuItems = useMemo(() => {
    if (siteConfig('CUSTOM_MENU') && customMenu && customMenu.length > 0) {
      return customMenu.filter(m => m && m.show !== false)
    }
    const defaults = []
    if (siteConfig('LIQUID_MENU_CATEGORY', null, CONFIG) !== false) {
      defaults.push({ name: locale.COMMON.CATEGORY, href: '/category', icon: 'fa-folder', subMenus: [] })
    }
    if (siteConfig('LIQUID_MENU_TAG', null, CONFIG) !== false) {
      defaults.push({ name: locale.COMMON.TAGS, href: '/tag', icon: 'fa-tag', subMenus: [] })
    }
    if (siteConfig('LIQUID_MENU_ARCHIVE', null, CONFIG) !== false) {
      defaults.push({ name: locale.COMMON.ARCHIVE || '归档', href: '/archive', icon: 'fa-archive', subMenus: [] })
    }
    let links = [
      { name: locale.NAV?.HOME || '首页', href: '/', icon: 'fa-house', subMenus: [] },
      ...defaults
    ]
    if (customNav) {
      links = links.concat(customNav.filter(n => n && n.show !== false))
    }
    return links
  }, [customMenu, customNav, locale])

  const tabs = useMemo(() => menuItems.map(item => ({
    icon: getIconPath(item.icon),
    label: item.name || item.title || '',
    href: item.href || '/',
    subMenus: item.subMenus || [],
    viewport: 24
  })), [menuItems])

  const activeTab = useMemo(() => {
    let idx = 0
    tabs.forEach((t, i) => {
      if (t.href !== '/' && router.asPath.startsWith(t.href)) idx = i
      else if (t.href === '/' && router.asPath === '/') idx = i
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
        if (tabs[idx].subMenus.length > 0) {
          setSubMenuOpen(subMenuOpen === idx ? null : idx)
        } else {
          setSubMenuOpen(null)
          router.push(tabs[idx].href)
        }
      }
    }
    document.addEventListener('lg-statechange', handleStateChange)

    return () => {
      clearTimeout(retryTimer)
      document.removeEventListener('lg-statechange', handleStateChange)
      if (container.contains(el)) container.removeChild(el)
    }
  }, [useWebGL, isDarkMode, activeTab, tabs, router, subMenuOpen])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (subMenuRef.current && !subMenuRef.current.contains(e.target)) {
        setSubMenuOpen(null)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  if (!useWebGL) {
    return (
      <>
        {subMenuOpen !== null && tabs[subMenuOpen]?.subMenus.length > 0 && (
          <div
            ref={subMenuRef}
            className='fixed bottom-24 left-1/2 -translate-x-1/2 z-40 glass-card p-2 min-w-[160px]'
          >
            {tabs[subMenuOpen].subMenus.map((s, i) => (
              <SmartLink
                key={i}
                href={s.href}
                className='block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-white/10 dark:hover:bg-white/5 rounded-lg'
                onClick={() => setSubMenuOpen(null)}
              >
                {s.icon && <i className={s.icon + ' mr-2'} />}
                {s.title || s.name}
              </SmartLink>
            ))}
          </div>
        )}
        <nav className='fixed bottom-0 left-0 right-0 z-30 glass-nav'>
          <div className='flex justify-around items-center max-w-md mx-auto py-2'>
            {tabs.map((tab, idx) => (
              <button
                key={idx}
                onClick={() => {
                  if (tab.subMenus.length > 0) {
                    setSubMenuOpen(subMenuOpen === idx ? null : idx)
                  } else {
                    setSubMenuOpen(null)
                    router.push(tab.href)
                  }
                }}
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
      </>
    )
  }

  return (
    <>
      {subMenuOpen !== null && tabs[subMenuOpen]?.subMenus.length > 0 && (
        <div
          ref={subMenuRef}
          className='fixed bottom-24 left-1/2 -translate-x-1/2 z-40 glass-card p-2 min-w-[160px]'
        >
          {tabs[subMenuOpen].subMenus.map((s, i) => (
            <SmartLink
              key={i}
              href={s.href}
              className='block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-white/10 dark:hover:bg-white/5 rounded-lg'
              onClick={() => setSubMenuOpen(null)}
            >
              {s.icon && <i className={s.icon + ' mr-2'} />}
              {s.title || s.name}
            </SmartLink>
          ))}
        </div>
      )}
      <nav className='fixed bottom-4 left-1/2 -translate-x-1/2 z-30 w-[calc(100%-2rem)] max-w-sm'>
        <div
          ref={containerRef}
          className='rounded-3xl overflow-hidden'
          style={{ height: '72px', background: isDarkMode ? '#000' : '#fff' }}
        />
      </nav>
    </>
  )
}

export default BottomTabs
