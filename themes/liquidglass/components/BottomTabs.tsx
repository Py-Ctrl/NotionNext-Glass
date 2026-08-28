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
import { generateCapsuleLensMap } from './capsuleLensMap'
import { getIconPath } from './iconMap'
import SmartLink from '@/components/SmartLink'
import CONFIG from '../config'

// SVG 透镜底栏（backdrop-filter: url(#feDisplacementMap)，折射真实页面内容）。
// 仅 Chromium 支持 url() 引用 SVG filter；Safari/Firefox 自动回退到下方 WebGL 底栏。
// 置为 false 可强制所有浏览器走 WebGL 底栏。
const SVG_LENS_ENABLED = true
// 透镜环带宽度（px）与最大位移（px），对应 WebGL 版 refractionHeight/refractionAmount
const LENS_REFRACTION_H = 18
const LENS_MAX_MAG = 14

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
  const [svgLens, setSvgLens] = React.useState(false)
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
    // svgLens 切换会更换承载 containerRef 的 DOM 节点，需重新挂载 observer
  }, [svgLens])

  React.useEffect(() => {
    try {
      const canvas = document.createElement('canvas')
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
      if (!gl) {
        setUseWebGL(false)
      } else {
        // 释放临时检测用的 WebGL 上下文，避免占用上下文槽位
        const loseExt = gl.getExtension('WEBGL_lose_context')
        if (loseExt) loseExt.loseContext()
      }
    } catch (e) {
      setUseWebGL(false)
    }
  }, [])

  // 检测 backdrop-filter: url(#svgFilter) 支持（仅 Chromium）
  React.useEffect(() => {
    try {
      if (SVG_LENS_ENABLED && typeof CSS !== 'undefined' && CSS.supports) {
        setSvgLens(CSS.supports('backdrop-filter', 'url(#liquid-tabs-lens-probe)'))
      }
    } catch (e) {
      setSvgLens(false)
    }
  }, [])

  // 位移图只随几何尺寸变化重建（Canvas2D 光栅，客户端才有 DOM canvas）
  const lensMap = React.useMemo(
    () => (svgLens ? generateCapsuleLensMap(canvasW, CONTAINER_H, LENS_REFRACTION_H, LENS_MAX_MAG) : ''),
    [svgLens, canvasW, CONTAINER_H]
  )
  const lensFilterId = React.useMemo(
    () => `liquid-tabs-lens-${Math.round(canvasW)}-${CONTAINER_H}`,
    [canvasW, CONTAINER_H]
  )

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

    // 指示器放在 tab 内容之后渲染：蓝色 accent mask 覆盖在白色文字上，选中的 tab 文字变蓝。
    // 指示器采样 uTabsGlassLayer（不含 tab text 的快照），折射不会扭曲已渲染的白色文字。
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
        highlight: { ...DEFAULT_HIGHLIGHT, alpha: 0.3 },
        outerShadow: null,
        chromaticAberration: false,
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

  // SVG 透镜底栏：backdrop-filter 直接采样真实页面，feDisplacementMap 做透镜折射
  if (svgLens) {
    const tabW = (canvasW - 2 * GLASS_PAD) / tabs.length
    const accentCss = isDarkMode ? 'rgba(0,145,255,0.5)' : 'rgba(0,136,255,0.5)'
    const textActive = isDarkMode ? '#ffffff' : '#111111'
    const textMuted = isDarkMode ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.5)'
    return (
      <>
        {renderSubMenu()}
        {canvasW > 10 && tabs.length > 0 && (
          <div
            ref={containerRef}
            style={{
              position: 'fixed',
              bottom: '16px',
              left: '50%',
              transform: 'translateX(-50%)',
              height: `${CONTAINER_H}px`,
              width: widthStyle,
              zIndex: 30,
            }}>
            <svg
              aria-hidden='true'
              width='0'
              height='0'
              style={{ position: 'absolute', pointerEvents: 'none' }}>
              <filter id={lensFilterId} colorInterpolationFilters='sRGB'>
                <feImage
                  href={lensMap}
                  x={0}
                  y={0}
                  width={canvasW}
                  height={CONTAINER_H}
                  result='map'
                  preserveAspectRatio='none'
                />
                <feDisplacementMap
                  in='SourceGraphic'
                  in2='map'
                  scale={LENS_MAX_MAG * 2}
                  xChannelSelector='R'
                  yChannelSelector='G'
                />
                <feGaussianBlur stdDeviation={1.4} />
                <feColorMatrix type='saturate' values='1.35' />
              </filter>
            </svg>
            <div
              style={{
                position: 'relative',
                width: '100%',
                height: '100%',
                borderRadius: `${CONTAINER_H / 2}px`,
                backdropFilter: `url(#${lensFilterId})`,
                WebkitBackdropFilter: 'blur(12px) saturate(1.35)',
                background: isDarkMode ? 'rgba(18,18,18,0.32)' : 'rgba(250,250,250,0.28)',
                boxShadow: isDarkMode
                  ? 'inset 0 1px 0 rgba(255,255,255,0.12), inset 0 -1px 0 rgba(0,0,0,0.25), 0 8px 32px rgba(0,0,0,0.4)'
                  : 'inset 0 1px 0 rgba(255,255,255,0.6), inset 0 -1px 0 rgba(255,255,255,0.2), 0 8px 32px rgba(0,0,0,0.18)',
              }}>
              {/* 滑动指示器 */}
              <div
                style={{
                  position: 'absolute',
                  top: GLASS_PAD,
                  left: GLASS_PAD,
                  width: tabW,
                  height: GLASS_H,
                  borderRadius: `${GLASS_H / 2}px`,
                  background: accentCss,
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.35), 0 2px 8px rgba(0,136,255,0.3)',
                  transform: `translateX(${activeTab * tabW}px)`,
                  transition: 'transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1)',
                }}
              />
              {/* tab 按钮 */}
              <div className='flex h-full'>
                {tabs.map((tab, i) => (
                  <button
                    key={i}
                    type='button'
                    onClick={() => handleTabSelect(i)}
                    className='flex-1 flex flex-col items-center justify-center gap-1 relative z-10 cursor-pointer'
                    style={{
                      color: activeTab === i ? textActive : textMuted,
                      WebkitTapHighlightColor: 'transparent',
                    }}>
                    <svg
                      style={{ width: ICON_SIZE, height: ICON_SIZE }}
                      viewBox='0 0 24 24'
                      fill='currentColor'>
                      <path d={tab.icon} />
                    </svg>
                    <span
                      style={{
                        fontSize: FONT_SIZE,
                        fontWeight: activeTab === i ? 600 : 400,
                        transition: 'color 0.2s',
                      }}>
                      {tab.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </>
    )
  }

  if (!useWebGL) {
    return (
      <>
        {renderSubMenu()}
        <nav className='fixed bottom-4 left-0 right-0 z-30 glass-nav'>
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
          className='z-30'
          style={{
            position: 'fixed',
            bottom: '16px',
            left: '50%',
            transform: 'translateX(-50%)',
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
