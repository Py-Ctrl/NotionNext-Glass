// @ts-nocheck
'use client'

import * as React from 'react'
import { useRouter } from 'next/router'
import { useGlobal } from '@/lib/global'
import { siteConfig } from '@/lib/config'
import { LiquidGlassCanvas } from '../lib/context'
import { makeGlassShape, makeText, makeTabDragInteractions } from '../lib/helpers'
import { getPalette, DEFAULT_HIGHLIGHT, DEFAULT_SHADOW } from '../lib/types'
import { getBottomBarWallpaper } from './liquidGlassWallpaper'
import { getIconPath } from './iconMap'
import SmartLink from '@/components/SmartLink'
import CONFIG from '../config'

const BottomTabs = (props) => {
  const { isDarkMode, locale } = useGlobal()
  const { customMenu, customNav } = props
  const router = useRouter()
  const routerRef = React.useRef(router)
  const rendererRef = React.useRef(null)
  const containerRef = React.useRef(null)
  const tabsRef = React.useRef([])
  const [canvasW, setCanvasW] = React.useState(380)
  const [useWebGL, setUseWebGL] = React.useState(true)
  const [subMenuOpen, setSubMenuOpen] = React.useState(null)
  const subMenuOpenRef = React.useRef(null)
  const subMenuRef = React.useRef(null)
  const [isDesktop, setIsDesktop] = React.useState(false)

  // 使用 UA 检测桌面端，避免 DevTools 改变窗口宽度导致误判
  React.useEffect(() => {
    const ua = navigator.userAgent || ''
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(ua)
    setIsDesktop(!isMobile)
  }, [])

  // 响应式尺寸：桌面端更大
  const CANVAS_H = isDesktop ? 84 : 72
  const CONTAINER_H = isDesktop ? 76 : 64
  const CONTAINER_Y = (CANVAS_H - CONTAINER_H) / 2
  const GLASS_H = isDesktop ? 68 : 56
  const GLASS_PAD = (CONTAINER_H - GLASS_H) / 2
  const TAB_WIDTH = isDesktop ? 96 : 76
  const ICON_SIZE = isDesktop ? 24 : 20
  const ICON_LAYOUT_SIZE = isDesktop ? 28 : 24
  const FONT_SIZE = isDesktop ? 13 : 11

  React.useEffect(() => { routerRef.current = router }, [router])
  React.useEffect(() => { subMenuOpenRef.current = subMenuOpen }, [subMenuOpen])

  const menuItems = React.useMemo(() => {
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

  const tabs = React.useMemo(() => menuItems.map(item => {
    let cleanSubMenus = []
    if (Array.isArray(item.subMenus)) {
      cleanSubMenus = item.subMenus.map(s => ({
        name: s?.name || s?.title || '',
        href: s?.href || s?.slug || '/',
        icon: typeof s?.icon === 'string' ? s.icon : ''
      }))
    }
    return {
      icon: getIconPath(item.icon),
      label: typeof item.name === 'string' ? item.name : (typeof item.title === 'string' ? item.title : (item.label || '')),
      href: item.href || item.url || item.slug || '/',
      subMenus: cleanSubMenus,
      viewport: 24
    }
  }), [menuItems])
  tabsRef.current = tabs

  const activeTab = React.useMemo(() => {
    let idx = 0
    tabs.forEach((t, i) => {
      if (t.href !== '/' && router.asPath.startsWith(t.href)) idx = i
      else if (t.href === '/' && router.asPath === '/') idx = i
    })
    return idx
  }, [router.asPath, tabs])

  React.useEffect(() => {
    if (!containerRef.current) return
    const updateWidth = () => {
      if (containerRef.current) {
        setCanvasW(containerRef.current.offsetWidth)
      }
    }
    updateWidth()
    const observer = new ResizeObserver(updateWidth)
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  React.useEffect(() => {
    try {
      const canvas = document.createElement('canvas')
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
      if (!gl) setUseWebGL(false)
    } catch (e) {
      setUseWebGL(false)
    }
  }, [])

  const handleTabSelect = React.useCallback((i) => {
    const tab = tabsRef.current[i]
    if (!tab) return
    if (tab.subMenus.length > 0) {
      setSubMenuOpen(prev => prev === i ? null : i)
    } else {
      setSubMenuOpen(null)
      routerRef.current.push(tab.href)
    }
  }, [])

  const { elements, interactions } = React.useMemo(() => {
    if (!tabs.length || canvasW < 10) return { elements: [], interactions: {} }

    const palette = getPalette(!isDarkMode)
    const els = []
    const ints = {}

    const containerX = 0
    const containerW = canvasW
    const containerR = CONTAINER_H / 2
    const glassX = GLASS_PAD
    const glassW = canvasW - 2 * GLASS_PAD
    const glassR = GLASS_H / 2
    const glassY = CONTAINER_Y + GLASS_PAD
    const tabW = glassW / tabs.length

    const containerEl = makeGlassShape(
      'tabs-container',
      { x: containerX, y: CONTAINER_Y, w: containerW, h: CONTAINER_H },
      {
        cornerRadius: containerR,
        refractionHeight: 24,
        refractionAmount: -24,
        blurRadius: 8,
        saturation: 1.5,
        surfaceColor: palette.tabsContainer,
        highlight: { ...DEFAULT_HIGHLIGHT, alpha: 0.5 },
        depthEffect: true,
      }
    )
    containerEl.isBottomTabContainer = { groupId: 'tabs', tabsCount: tabs.length }
    containerEl.independentBackdrop = false
    els.push(containerEl)

    const dragInteractions = makeTabDragInteractions('tabs', tabW, tabs.length, handleTabSelect, rendererRef)

    for (let i = 0; i < tabs.length; i++) {
      const tab = tabs[i]
      const tabEl = makeText(
        `tab-${i}`,
        { x: glassX + tabW * i, y: glassY, w: tabW, h: GLASS_H },
        tab.label,
        {
          color: palette.tabsContentColor,
          fontSizePx: FONT_SIZE,
          fontWeight: 400,
          align: 'center',
          paddingPx: 0,
          halo: palette.tabsTextHalo,
          icon: { path: tab.icon, size: ICON_SIZE, layoutSize: ICON_LAYOUT_SIZE, color: palette.tabsContentColor, viewport: 24 }
        }
      )
      tabEl.isBottomTabContent = {
        groupId: 'tabs',
        containerCenterX: containerX + containerW / 2,
        containerCenterY: CONTAINER_Y + CONTAINER_H / 2,
        containerWidth: containerW,
      }
      els.push(tabEl)
      ints[`tab-${i}`] = {
        onTap: () => handleTabSelect(i),
        onDragStart: dragInteractions.onDragStart,
        onDrag: dragInteractions.onDrag,
        onDragEnd: dragInteractions.onDragEnd,
      }
    }

    ints['tabs-container'] = dragInteractions

    const indicatorEl = makeGlassShape(
      'tabs-indicator',
      { x: glassX, y: glassY, w: tabW, h: GLASS_H },
      {
        cornerRadius: glassR,
        refractionHeight: 10,
        refractionAmount: -14,
        blurRadius: 0,
        saturation: 1.0,
        tintColor: [0, 0, 0, 0],
        surfaceColor: [0, 0, 0, 0],
        highlight: { ...DEFAULT_HIGHLIGHT, alpha: 0.5 },
        outerShadow: { ...DEFAULT_SHADOW },
        innerShadow: { radius: 8, alpha: 0.3, offsetX: 0, offsetY: 8 },
        chromaticAberration: true,
      }
    )
    indicatorEl.independentBackdrop = false
    indicatorEl.isBottomTabIndicator = {
      groupId: 'tabs',
      dragWidth: tabW,
      dimColor: palette.backIconColor,
      accentColor: [...palette.tabsAccent],
      containerRect: { x: glassX - GLASS_PAD, y: glassY, w: glassW + 2 * GLASS_PAD, h: GLASS_H },
      containerCenterX: containerX + containerW / 2,
      containerCenterY: CONTAINER_Y + CONTAINER_H / 2,
      containerWidth: containerW,
      tabContentIds: tabs.map((_, i) => `tab-${i}`),
      tabContentRects: tabs.map((_, i) => ({ x: glassX + tabW * i, y: glassY, w: tabW, h: GLASS_H })),
    }
    els.push(indicatorEl)

    return { elements: els, interactions: ints }
  }, [tabs, isDarkMode, canvasW, handleTabSelect, isDesktop])

  const tabTargets = React.useMemo(() => ({
    'tabs': { tabIndex: activeTab, tabsCount: tabs.length }
  }), [activeTab, tabs.length])

  React.useEffect(() => {
    const handleClickOutside = (e) => {
      if (subMenuRef.current && !subMenuRef.current.contains(e.target)) {
        setSubMenuOpen(null)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  const widthStyle = `min(calc(100% - ${isDesktop ? '4rem' : '2rem'}), ${tabs.length * TAB_WIDTH}px)`

  const renderSubMenu = () => {
    if (subMenuOpen === null || !tabs[subMenuOpen]?.subMenus.length) return null
    return (
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
            {s.name}
          </SmartLink>
        ))}
      </div>
    )
  }

  if (!useWebGL) {
    return (
      <>
        {renderSubMenu()}
        <nav className='fixed bottom-0 left-0 right-0 z-30 glass-nav'>
          <div className='flex justify-around items-center mx-auto py-2' style={{ width: widthStyle }}>
            {tabs.map((tab, idx) => (
              <button
                key={idx}
                onClick={() => handleTabSelect(idx)}
                className={`flex flex-col items-center gap-1 px-3 py-1 text-xs transition-colors ${
                  activeTab === idx ? 'text-indigo-500' : 'text-gray-500 dark:text-gray-400'
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
      {renderSubMenu()}
      {canvasW > 10 && tabs.length > 0 && (
        <LiquidGlassCanvas
          wallpaperSrc={getBottomBarWallpaper(isDarkMode)}
          elements={elements}
          interactions={interactions}
          tabTargets={tabTargets}
          rendererRef={rendererRef}
          contentHeight={CANVAS_H}
          dpr={1.5}
          containerRef={containerRef}
          className='fixed bottom-0 left-1/2 -translate-x-1/2 z-30'
          style={{
            height: `${CANVAS_H}px`,
            width: widthStyle,
            borderRadius: `${CANVAS_H / 2}px`,
            overflow: 'hidden',
          }}
        />
      )}
    </>
  )
}

export default BottomTabs
