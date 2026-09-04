// @ts-nocheck
'use client'

import * as React from 'react'
import { useRouter } from 'next/router'
import { useGlobal } from '@/lib/global'
import { siteConfig } from '@/lib/config'
import { generateCapsuleLensMap, generateRoundedRectLensMap } from './capsuleLensMap'
import { getIconPath } from './iconMap'
import SmartLink from '@/components/SmartLink'
import CONFIG from '../config'

// SVG 透镜底栏（backdrop-filter: url(#feDisplacementMap)，折射真实页面内容）。
// 仅 Chromium 支持 url() 引用 SVG filter；Safari/Firefox 回退到 CSS 玻璃底栏。
// 按钮类组件一律 SVG/CSS 实现（WebGL 开销大，只留给真正需要的场景）。
const SVG_LENS_ENABLED = true
// 透镜环带宽度（px）与最大位移（px），对应 WebGL 版 refractionHeight/refractionAmount
const LENS_REFRACTION_H = 18
const LENS_MAX_MAG = 14
// 指示器透镜（原版 refractionHeight 10 / refractionAmount -14，即位移 14px）
const IND_REFRACTION_H = 10
const IND_MAX_MAG = 14

// --- 长按折射弹簧（原版 InteractiveHighlight.kt spring(0.5f, 300f)） ---
const SPRING_K = 300
const SPRING_ZETA = 0.5
const SPRING_OMEGA_N = Math.sqrt(SPRING_K)
const SPRING_OMEGA_D = SPRING_OMEGA_N * Math.sqrt(1 - SPRING_ZETA * SPRING_ZETA)
const SPRING_THRESHOLD = 0.003

function springStep1D(current, velocity, target, dt) {
  const x0 = current - target
  const v0 = velocity
  const decay = Math.exp(-SPRING_ZETA * SPRING_OMEGA_N * dt)
  const cosWd = Math.cos(SPRING_OMEGA_D * dt)
  const sinWd = Math.sin(SPRING_OMEGA_D * dt)
  const b0 = (v0 + SPRING_ZETA * SPRING_OMEGA_N * x0) / SPRING_OMEGA_D
  const offset = x0 * decay * cosWd + b0 * decay * sinWd
  const newVel =
    -SPRING_ZETA * SPRING_OMEGA_N * offset +
    decay * (-x0 * SPRING_OMEGA_D * sinWd + b0 * SPRING_OMEGA_D * cosWd)
  return { current: target + offset, velocity: newVel }
}

const BottomTabs = (props) => {
  const { isDarkMode, locale } = useGlobal()
  const { customMenu, customNav } = props
  const router = useRouter()
  const routerRef = React.useRef(router)
  const containerRef = React.useRef(null)
  const tabsRef = React.useRef([])
  // SVG 透镜分支的透镜底栏
  const glassRef = React.useRef(null)
  const indicatorRef = React.useRef(null)
  const indXRef = React.useRef(0)
  const visualIdxRef = React.useRef(0)
  const pressedBtnRef = React.useRef(null)
  const suppressClickUntilRef = React.useRef(0)
  const pressRef = React.useRef({ progress: 0, velocity: 0, target: 0, px: 0, pv: 0, pxTarget: 0, raf: 0, last: 0, pointerId: null, startX: 0, startY: 0, indX0: 0, dragging: false, release: null, move: null })
  const [canvasW, setCanvasW] = React.useState(380)
  const [svgLens, setSvgLens] = React.useState(false)
  const [subMenuOpen, setSubMenuOpen] = React.useState(null)
  const [visualIdxState, setVisualIdxState] = React.useState(0)
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
  const CONTAINER_H = isDesktop ? 76 : 64
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
  const indW = tabs.length > 0 ? (canvasW - 2 * GLASS_PAD) / tabs.length : 0
  const lensMap = React.useMemo(
    () => (svgLens ? generateCapsuleLensMap(canvasW, CONTAINER_H, LENS_REFRACTION_H, LENS_MAX_MAG) : ''),
    [svgLens, canvasW, CONTAINER_H]
  )
  const lensFilterId = React.useMemo(
    () => `liquid-tabs-lens-${Math.round(canvasW)}-${CONTAINER_H}`,
    [canvasW, CONTAINER_H]
  )
  // 指示器透镜：胶囊位移图（原版 refractionHeight 10 / refractionAmount -14 / 无模糊 / 饱和 1）
  const indMap = React.useMemo(
    () => (svgLens && indW > 4 ? generateRoundedRectLensMap(indW, GLASS_H, GLASS_H / 2, IND_REFRACTION_H, IND_MAX_MAG) : ''),
    [svgLens, indW, GLASS_H]
  )
  const indFilterId = React.useMemo(
    () => `liquid-tabs-ind-${Math.round(indW)}-${Math.round(GLASS_H)}`,
    [indW, GLASS_H]
  )

  // feImage 的 data URL 异步加载完成后 Chromium 不重跑 backdrop-filter，
  // 必须等位移图预加载完成后再强制重绘（关-开），否则透镜不生效
  React.useEffect(() => {
    if (!svgLens || !lensMap || !glassRef.current) return
    const el = glassRef.current
    const url = `url(#${lensFilterId})`
    let cancelled = false
    let t1 = 0
    let t2 = 0
    const img = new Image()
    img.onload = () => {
      if (cancelled) return
      t1 = window.setTimeout(() => {
        if (cancelled) return
        el.style.backdropFilter = 'none'
        t2 = window.setTimeout(() => {
          if (cancelled) return
          el.style.backdropFilter = url
        }, 100)
      }, 50)
    }
    img.src = lensMap
    return () => {
      cancelled = true
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [svgLens, lensMap, lensFilterId])

  React.useEffect(() => {
    if (!svgLens || !indMap || !indicatorRef.current) return
    const el = indicatorRef.current
    const url = `url(#${indFilterId})`
    let cancelled = false
    let t1 = 0
    let t2 = 0
    const img = new Image()
    img.onload = () => {
      if (cancelled) return
      t1 = window.setTimeout(() => {
        if (cancelled) return
        el.style.backdropFilter = 'none'
        t2 = window.setTimeout(() => {
          if (cancelled) return
          el.style.backdropFilter = url
        }, 100)
      }, 50)
    }
    img.src = indMap
    return () => {
      cancelled = true
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [svgLens, indMap, indFilterId])

  // 长按（原版 InteractiveHighlight spring(0.5f, 300f)）：
  // 只放大指示器（×1.39，即 56→78dp 的比例）与被按 tab 的内容（→1.2），
  // 底栏容器本身不缩放。折射强度保持常量 28：超出底栏的部分随 transform
  // 等比放大折射，加大位移 scale 会把边缘撕出锯齿
  const applyFrame = React.useCallback((p, x) => {
    const ind = indicatorRef.current
    if (ind) {
      const s = 1 + (78 / 56 - 1) * p
      // idle 只留淡弱在场感（不显眼、不误认成第二个圈）；按住/拖动时满显放大
      const o = 0.35 + 0.65 * p
      ind.style.opacity = String(o)
      ind.style.transform = `translateX(${x}px) scale(${s})`
    }
    const btn = pressedBtnRef.current
    if (btn) {
      btn.style.transform = p > 0 ? `scale(${1 + 0.2 * p})` : ''
    }
  }, [])

  // 双弹簧逐帧驱动：progress（按压量）+ px（指示器位置），无 CSS transition，避免互相打断
  const startPressLoop = React.useCallback(() => {
    const st = pressRef.current
    if (st.raf) return
    const idle =
      st.progress === st.target && st.velocity === 0 &&
      st.px === st.pxTarget && st.pv === 0
    if (idle) return
    st.last = performance.now()
    const tick = () => {
      const now = performance.now()
      const dt = Math.min((now - st.last) / 1000, 0.05)
      st.last = now
      const settledPress =
        Math.abs(st.target - st.progress) <= SPRING_THRESHOLD &&
        Math.abs(st.velocity) <= SPRING_THRESHOLD
      const settledPos =
        Math.abs(st.pxTarget - st.px) <= 0.5 && Math.abs(st.pv) <= 0.5
      if (settledPress && settledPos) {
        st.progress = st.target
        st.velocity = 0
        st.px = st.pxTarget
        st.pv = 0
        indXRef.current = st.px
        applyFrame(st.progress, st.px)
        st.raf = 0
        return
      }
      if (!settledPress) {
        const r = springStep1D(st.progress, st.velocity, st.target, dt)
        st.progress = r.current
        st.velocity = r.velocity
      }
      if (!settledPos) {
        const r = springStep1D(st.px, st.pv, st.pxTarget, dt)
        st.px = r.current
        st.pv = r.velocity
        indXRef.current = st.px
      }
      applyFrame(st.progress, st.px)
      st.raf = requestAnimationFrame(tick)
    }
    st.raf = requestAnimationFrame(tick)
  }, [applyFrame])

  const setVisualIdx = React.useCallback((i) => {
    if (visualIdxRef.current === i) return
    visualIdxRef.current = i
    setVisualIdxState(i)
  }, [])

  // 拖动跟手：直接设置位置并同步弹簧状态（清速度）
  const followIndicator = React.useCallback((x) => {
    const st = pressRef.current
    st.px = x
    st.pv = 0
    st.pxTarget = x
    indXRef.current = x
    applyFrame(st.progress, x)
  }, [applyFrame])

  // 弹簧动画到目标位置（拖动 snap / 路由切换）
  const animateIndicatorTo = React.useCallback((x) => {
    const st = pressRef.current
    st.pxTarget = x
    startPressLoop()
  }, [startPressLoop])

  // 路由驱动指示器位置（拖动/点击之外的来源）
  React.useEffect(() => {
    if (!svgLens || indW <= 4) return
    animateIndicatorTo(activeTab * indW)
    setVisualIdx(activeTab)
  }, [svgLens, activeTab, indW, animateIndicatorTo, setVisualIdx])

  // 底栏指针交互：拖动切换 tab（横向），按住不动触发长按放大
  const handleBarPointerDown = React.useCallback((e) => {
    const st = pressRef.current
    if (st.pointerId !== null) return
    const n = Math.max(1, tabsRef.current.length)
    const tabW = indW
    if (tabW <= 4) return
    st.pointerId = e.pointerId
    st.startX = e.clientX
    st.startY = e.clientY
    st.indX0 = indXRef.current
    st.dragging = false
    st.target = 1
    pressedBtnRef.current = e.target.closest && e.target.closest('button')
    startPressLoop()

    const move = (ev) => {
      if (ev.pointerId !== st.pointerId) return
      const dx = ev.clientX - st.startX
      const dy = ev.clientY - st.startY
      if (!st.dragging) {
        // 横向主导且超过 14px 才算拖动：按住时的微漂移不取消长按（原版行为）
        if (Math.abs(dx) < 14 || Math.abs(dx) < Math.abs(dy) * 1.5) return
        st.dragging = true
        // 拖动时保持放大跟手（原版：指示器随手指移动且持续放大，不缩回）；
        // 内容层不放大，避免按住按钮跟随移动产生错位
        st.target = 1
        const btn = pressedBtnRef.current
        if (btn) btn.style.transform = ''
        startPressLoop()
      }
      const maxX = (n - 1) * tabW
      const x = Math.max(0, Math.min(maxX, st.indX0 + dx))
      followIndicator(x)
      setVisualIdx(Math.max(0, Math.min(n - 1, Math.round(x / tabW))))
    }

    const release = (ev) => {
      if (ev.pointerId !== st.pointerId) return
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', release)
      window.removeEventListener('pointercancel', release)
      st.pointerId = null
      st.release = null
      st.move = null
      const btn = pressedBtnRef.current
      if (st.dragging) {
        // 拖动结束：snap 到最近的 tab 并导航；抑制随后的原生 click
        // 用时间戳而非布尔：拖动后 click 可能落在祖先元素上不触发 handler，布尔会遗留误吞下次点击
        suppressClickUntilRef.current = performance.now() + 300
        const idx = Math.max(0, Math.min(n - 1, Math.round(indXRef.current / tabW)))
        animateIndicatorTo(idx * tabW)
        setVisualIdx(idx)
        const tab = tabsRef.current[idx]
        if (tab) {
          if (tab.subMenus && tab.subMenus.length > 0) {
            setSubMenuOpen(idx)
          } else {
            setSubMenuOpen(null)
            routerRef.current.push(tab.href)
          }
        }
      }
      pressedBtnRef.current = null
      if (btn) btn.style.transform = ''
      st.target = 0
      startPressLoop()
    }

    st.move = move
    st.release = release
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', release)
    window.addEventListener('pointercancel', release)
  }, [indW, followIndicator, animateIndicatorTo, setVisualIdx, startPressLoop])

  React.useEffect(() => {
    const st = pressRef.current
    return () => {
      if (st.raf) {
        cancelAnimationFrame(st.raf)
        st.raf = 0
      }
      if (st.release) {
        window.removeEventListener('pointermove', st.move)
        window.removeEventListener('pointerup', st.release)
        window.removeEventListener('pointercancel', st.release)
        st.release = null
        st.move = null
      }
    }
  }, [])

  const handleTabSelect = React.useCallback((i) => {
    if (performance.now() < suppressClickUntilRef.current) return
    const tab = tabsRef.current[i]
    if (!tab) return
    setVisualIdx(i)
    if (tab.subMenus.length > 0) {
      setSubMenuOpen(prev => prev === i ? null : i)
    } else {
      setSubMenuOpen(null)
      routerRef.current.push(tab.href)
    }
  }, [setVisualIdx])

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

  // SVG 透镜底栏：backdrop-filter 直接采样真实页面，feDisplacementMap 做透镜折射。
  // 指示器是独立透明透镜（原版 tint/surface 全透明），选中项靠文字变蓝表达
  if (svgLens) {
    const accentText = isDarkMode ? '#0A84FF' : '#007AFF'
    const textMuted = isDarkMode ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.5)'
    return (
      <>
        {renderSubMenu()}
        {canvasW > 10 && tabs.length > 0 && (
          <div
            ref={containerRef}
            onPointerDown={handleBarPointerDown}
            onContextMenu={(e) => e.preventDefault()}
            style={{
              position: 'fixed',
              bottom: '16px',
              left: '50%',
              transform: 'translateX(-50%)',
              height: `${CONTAINER_H}px`,
              width: widthStyle,
              zIndex: 30,
              userSelect: 'none',
              WebkitUserSelect: 'none',
              WebkitTouchCallout: 'none',
              // 手势全归底栏（原版 Android bar 独占触摸）：按住不被页面滚动抢走触发 pointercancel
              touchAction: 'none',
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
              <filter id={indFilterId} colorInterpolationFilters='sRGB'>
                <feImage
                  href={indMap}
                  x={0}
                  y={0}
                  width={indW}
                  height={GLASS_H}
                  result='map'
                  preserveAspectRatio='none'
                />
                <feDisplacementMap
                  in='SourceGraphic'
                  in2='map'
                  scale={IND_MAX_MAG * 2}
                  xChannelSelector='R'
                  yChannelSelector='G'
                />
                <feColorMatrix type='saturate' values='1.0' />
              </filter>
            </svg>
            {/* 玻璃底板 */}
            <div
              ref={glassRef}
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: `${CONTAINER_H / 2}px`,
                backdropFilter: `url(#${lensFilterId})`,
                WebkitBackdropFilter: 'blur(12px) saturate(1.35)',
                background: isDarkMode ? 'rgba(18,18,18,0.32)' : 'rgba(250,250,250,0.28)',
                boxShadow: isDarkMode
                  ? 'inset 0 1px 0 rgba(255,255,255,0.12), inset 0 -1px 0 rgba(0,0,0,0.25), 0 8px 32px rgba(0,0,0,0.4)'
                  : 'inset 0 1px 0 rgba(255,255,255,0.6), inset 0 -1px 0 rgba(255,255,255,0.2), 0 8px 32px rgba(0,0,0,0.18)',
              }}
            />
            {/* 透明透镜指示器：只折射放大背后内容 + 边缘高光，无实心底色。
                按压放大 ×1.39 超出底栏上下边缘，超出部分随 transform 等比放大折射 */}
            <div
              ref={indicatorRef}
              style={{
                position: 'absolute',
                top: GLASS_PAD,
                left: GLASS_PAD,
                width: indW,
                height: GLASS_H,
                borderRadius: `${GLASS_H / 2}px`,
                background: 'transparent',
                backdropFilter: `url(#${indFilterId})`,
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)',
                zIndex: 2,
                pointerEvents: 'none',
                transformOrigin: 'center',
                willChange: 'transform',
              }}
            />
            {/* tab 内容层：指示器之上，文字不被透镜扭曲 */}
            <div className='absolute inset-0 flex h-full' style={{ zIndex: 3 }}>
              {tabs.map((tab, i) => {
                const isActive = visualIdxState === i
                return (
                  <button
                    key={i}
                    type='button'
                    onClick={() => handleTabSelect(i)}
                    className='flex-1 flex flex-col items-center justify-center gap-1 relative cursor-pointer'
                    style={{
                      color: isActive ? accentText : textMuted,
                      WebkitTapHighlightColor: 'transparent',
                      transformOrigin: 'center center',
                      willChange: 'transform',
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
                        fontWeight: isActive ? 600 : 400,
                        whiteSpace: 'nowrap',
                        transition: 'color 0.2s, font-weight 0.2s',
                      }}>
                      {tab.label}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </>
    )
  }

  // 回退底栏：SSR / 不支持 backdrop-filter url() 的浏览器（Safari、Firefox、触屏）
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

export default BottomTabs
