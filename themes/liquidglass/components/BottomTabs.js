import { useEffect, useRef, useState, useMemo } from 'react'
import { useGlobal } from '@/lib/global'
import { useRouter } from 'next/router'
import { siteConfig } from '@/lib/config'
import CONFIG from '../config'
import SmartLink from '@/components/SmartLink'
import { getWallpaper } from './liquidGlassWallpaper'

const ICON_MAP = {
  'house': 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z',
  'home': 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z',
  'th': 'M5 5h4v4H5V5zm0 6h4v4H5v-4zm6-6h4v4h-4V5zm0 6h4v4h-4v-4z',
  'th-list': 'M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z',
  'folder': 'M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z',
  'folder-open': 'M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2z',
  'tag': 'M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58.55 0 1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41 0-.55-.23-1.06-.59-1.42z',
  'tags': 'M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58.55 0 1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41 0-.55-.23-1.06-.59-1.42z',
  'archive': 'M20.54 5.23l-1.39-1.68C18.88 3.21 18.47 3 18 3H6c-.47 0-.88.21-1.16.55L3.46 5.23C3.17 5.57 3 6.02 3 6.5V19c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6.5c0-.48-.17-.93-.46-1.27z',
  'search': 'M15.5 14h-.79l-.28-.27a6.5 6.5 0 1 0-.7.7l.27.28v.79l5 4.99L20.49 19zm-6 0A4.5 4.5 0 1 1 14 9.5 4.5 4.5 0 0 1 9.5 14z',
  'magnifying-glass': 'M15.5 14h-.79l-.28-.27a6.5 6.5 0 1 0-.7.7l.27.28v.79l5 4.99L20.49 19zm-6 0A4.5 4.5 0 1 1 14 9.5 4.5 4.5 0 0 1 9.5 14z',
  'user': 'M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5zm0 2c-3.33 0-10 1.67-10 5v3h20v-3c0-3.33-6.67-5-10-5z',
  'book': 'M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z',
  'book-bookmark': 'M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z',
  'link': 'M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z',
  'globe': 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93z',
  'rss': 'M6.18 15.64a2.18 2.18 0 0 1 2.18 2.18C8.36 19 7.38 20 6.18 20 5 20 4 19 4 17.82a2.18 2.18 0 0 1 2.18-2.18M4 4.44A15.56 15.56 0 0 1 19.56 20h-2.83A12.73 12.73 0 0 0 4 7.27V4.44m0 5.66a9.9 9.9 0 0 1 9.9 9.9h-2.83A7.07 7.07 0 0 0 4 12.93V10.1z',
  'envelope': 'M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z',
  'star': 'M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z',
  'heart': 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z',
  'fire': 'M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67zM11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-.36 3.6-1.21 4.62-2.58.39 1.29.59 2.65.59 4.04 0 2.65-2.15 4.8-4.8 4.8z',
  'bars': 'M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z',
  'gear': 'M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94 0 .31.04.64.09.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z',
  'info': 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z',
  'bell': 'M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z',
  'bookmark': 'M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z',
  'edit': 'M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z',
  'comment': 'M21.99 4c0-1.1-.89-2-1.99-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4-.01-18z',
  'sun': 'M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0 .39-.39.39-1.03 0-1.41l-1.06-1.06zm1.06-10.96c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06zM7.05 18.36c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06z',
  'moon': 'M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-2.98 0-5.4-2.42-5.4-5.4 0-1.81.89-3.42 2.26-4.4-.44-.06-.9-.1-1.36-.1z',
  'github': 'M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.523 2 12 2z',
  'twitter': 'M23.643 4.937c-.835.37-1.732.62-2.675.733.962-.576 1.7-1.49 2.048-2.578-.9.534-1.897.922-2.958 1.13-.85-.904-2.06-1.47-3.4-1.47-2.572 0-4.658 2.086-4.658 4.66 0 .364.042.718.12 1.06-3.873-.195-7.304-2.05-9.602-4.868-.4.69-.63 1.49-.63 2.342 0 1.616.823 3.043 2.072 3.878-.764-.025-1.482-.234-2.11-.583v.06c0 2.257 1.605 4.14 3.737 4.568-.392.106-.803.162-1.227.162-.3 0-.593-.028-.877-.082.593 1.85 2.313 3.198 4.352 3.234-1.595 1.25-3.604 1.995-5.786 1.995-.376 0-.747-.022-1.112-.065 2.062 1.323 4.51 2.093 7.14 2.093 8.57 0 13.255-7.098 13.255-13.254 0-.2-.005-.402-.014-.602.91-.658 1.7-1.477 2.323-2.41z',
  'weibo': 'M10.098 20.323c-3.977.391-7.414-1.406-7.672-4.02-.259-2.609 2.759-5.047 6.74-5.441 3.979-.394 7.413 1.404 7.671 4.018.259 2.6-2.759 5.049-6.737 5.439zm9.222-7.717c-.245-.066-.413-.11-.286-.42.276-.683.31-1.273.014-1.696-.566-.808-2.108-.766-3.871-.022 0 0-.553.243-.41-.197.273-.876.227-1.611-.197-2.034-.949-.952-3.484.04-5.667 2.224-1.626 1.627-2.572 3.348-2.572 4.847 0 2.857 3.66 4.604 7.245 4.604 4.687 0 7.812-2.728 7.812-4.876 0-1.293-1.094-2.043-2.055-2.334z'
}

const DEFAULT_ICON = 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5'

const STYLE_PREFIXES = ['fa-solid', 'fa-regular', 'fa-brands', 'fa-light', 'fa-thin', 'fa-duotone', 'fas', 'far', 'fab', 'fal', 'fat', 'fad']

const getIconPath = (iconClass) => {
  if (!iconClass) return DEFAULT_ICON
  const parts = iconClass.split(/\s+/)
  for (const part of parts) {
    const trimmed = part.trim()
    if (!trimmed || STYLE_PREFIXES.includes(trimmed)) continue
    const name = trimmed.replace(/^fa-/, '')
    if (ICON_MAP[name]) return ICON_MAP[name]
  }
  return DEFAULT_ICON
}

const BottomTabs = (props) => {
  const { isDarkMode, locale } = useGlobal()
  const { customMenu, customNav } = props
  const router = useRouter()
  const routerRef = useRef(router)
  const containerRef = useRef(null)
  const elRef = useRef(null)
  const [useWebGL, setUseWebGL] = useState(false)
  const isSettingStateRef = useRef(false)
  const [subMenuOpen, setSubMenuOpen] = useState(null)
  const subMenuOpenRef = useRef(null)
  const subMenuRef = useRef(null)

  useEffect(() => { routerRef.current = router }, [router])
  useEffect(() => { subMenuOpenRef.current = subMenuOpen }, [subMenuOpen])

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

  // Effect A: 创建元素和设置 tabs（仅在 tabs/isDarkMode/useWebGL 变化时重建）
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
    elRef.current = el

    let retries = 5
    let retryTimer = null

    const trySetTabs = () => {
      if (typeof el.setTabs === 'function') {
        el.setTabs([tabs.map(t => ({
          icon: t.icon,
          label: t.label,
          viewport: t.viewport
        }))])
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
          setSubMenuOpen(subMenuOpenRef.current === idx ? null : idx)
        } else {
          setSubMenuOpen(null)
          routerRef.current.push(tabs[idx].href)
        }
      }
    }
    document.addEventListener('lg-statechange', handleStateChange)

    return () => {
      clearTimeout(retryTimer)
      document.removeEventListener('lg-statechange', handleStateChange)
      if (container.contains(el)) container.removeChild(el)
      elRef.current = null
    }
  }, [useWebGL, isDarkMode, tabs])

  // Effect B: 仅更新选中状态（路由变化时只调 setState，不重建元素）
  useEffect(() => {
    if (!useWebGL || !elRef.current) return
    const el = elRef.current
    if (typeof el.setState === 'function') {
      isSettingStateRef.current = true
      el.setState({ selectedTab: activeTab })
      setTimeout(() => { isSettingStateRef.current = false }, 200)
    }
  }, [useWebGL, activeTab])

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
          <div
            className='flex justify-around items-center mx-auto py-2'
            style={{ width: `min(calc(100% - 2rem), ${tabs.length * 76}px)` }}
          >
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
      <nav
        ref={containerRef}
        className='fixed bottom-4 left-1/2 -translate-x-1/2 z-30 rounded-3xl overflow-hidden'
        style={{ height: '72px', width: `min(calc(100% - 2rem), ${tabs.length * 76}px)`, background: isDarkMode ? '#000' : '#fff' }}
      />
    </>
  )
}

export default BottomTabs
