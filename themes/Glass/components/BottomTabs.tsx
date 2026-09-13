// @ts-nocheck
'use client'

import * as React from 'react'
import { useRouter } from 'next/router'
import { useGlobal } from '@/lib/global'
import { siteConfig } from '@/lib/config'
import { generateCapsuleLensMap } from './capsuleLensMap'
import { getIconPath } from './iconMap'
import SmartLink from '@/components/SmartLink'
import CONFIG from '../config'

// SVG 透镜底栏（backdrop-filter: url(#feDisplacementMap)，折射真实页面内容）。
// 仅 Chromium 支持 url() 引用 SVG filter；Safari/Firefox 回退到 CSS 玻璃底栏。
// 容器玻璃参数为长期调校值（blur 1.4 / band 18 / mag 14 / saturate 1.35），
// 指示器按压 ramp 1:1 对齐原版 liquid-glass-webgl：
//   lens(10dp*p, 14dp*p) 折射随按压 ramp（静止为 0），表面全透明，
//   静止仅 10% 暗化层；蓝色 = 选中 tab 图标+文字染 accent(#0088FF/#0091FF)。
const SVG_LENS_ENABLED = true
// 容器玻璃：径向满幅场，refractionHeight=CONTAINER_H/2 覆盖到中心、minRatio=0.35
// 让中间也保留非零折射（不再有"中心完全不折射的空心椭圆"）；中心强度弱
//（0.35*10≈3.5px），避免满幅强位移把整条内容朝圆心内压成"被压/发糊"。
const LENS_MAX_MAG = 10
// 指示器透镜（原版 refractionAmount -14，乘以 pressProgress）满幅折射到中心
const IND_MAX_MAG = 14
// 原版强调色：light #0088FF / dark #0091FF
const ACCENT_LIGHT = '#0088FF'
const ACCENT_DARK = '#0091FF'

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
  const suppressClickUntilRef = React.useRef(0)
  // SVG filter 元素引用：按帧更新位移强度 / 位移图尺寸
  const indDispRef = React.useRef(null)
  const indFeImgRef = React.useRef(null)
  const indDimRef = React.useRef(null)
  const indDarkRef = React.useRef(null)
  const indHiRef = React.useRef(null)
  // feGaussianBlur 元素（指示器 filter 内，去锯齿）：stdDeviation 随按压 ramp
  const indBlurRef = React.useRef(null)
  // applyFrame 必须读到最新几何值：useCallback([]) 会捕获首帧（isDesktop=false、
  // canvasW 初值）的尺寸，按压/路由动画落定后会把指示器写回错误的小尺寸
  const geoRef = React.useRef(null)
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
        // 用最朴素 #probe 探测：带具体长 id 的 value 在移动端 Chromium 的 CSS.supports
        // 中可能返回 false（误判为不支持 → 永远回退 CSS 模糊）
        setSvgLens(CSS.supports('backdrop-filter', 'url(#probe)'))
      }
    } catch (e) {
      setSvgLens(false)
    }
  }, [])

  // 位移图只随几何尺寸变化重建（Canvas2D 光栅，客户端才有 DOM canvas）
  const indW = tabs.length > 0 ? (canvasW - 2 * GLASS_PAD) / tabs.length : 0
  const lensMap = React.useMemo(
    () => (svgLens ? generateCapsuleLensMap(canvasW, CONTAINER_H, CONTAINER_H / 2, LENS_MAX_MAG, 0.35) : ''),
    [svgLens, canvasW, CONTAINER_H]
  )
  const lensFilterId = React.useMemo(
    () => `liquid-tabs-lens-${Math.round(canvasW)}-${CONTAINER_H}`,
    [canvasW, CONTAINER_H]
  )
  // 指示器透镜：径向凸透镜场（原版 refractionHeight 10 / refractionAmount -14），
  // 位移从边缘向中心平滑衰减；refractionHeight=GLASS_H/2 覆盖到中心且
  // minRatio=0.45 保证中心保留非零折射 → 消除核心盒模型胶囊退化成中心线
  // 造成的"中心完全不折射的空心椭圆"。中心强度 0.45*14≈6.3px，温和不内压。
  const indMap = React.useMemo(
    () =>
      svgLens && indW > 4
        ? generateCapsuleLensMap(indW, GLASS_H, GLASS_H / 2, IND_MAX_MAG, 0.45)
        : '',
    [svgLens, indW, GLASS_H]
  )
  const indFilterId = React.useMemo(
    () => `liquid-tabs-ind-${Math.round(indW)}-${Math.round(GLASS_H)}`,
    [indW, GLASS_H]
  )
  geoRef.current = { indW, GLASS_H, GLASS_PAD }

  // 位移图是 data URL，异步解码；Chromium 解码完成后不会重跑 backdrop-filter，
  // 必须让 'none' 真实绘制至少一帧再写回 url()，filter 才会带着已加载的 feImage 重新执行。
  //
  // 教训（连续三轮"折射没效果"的根因）：同步 none→回流→url 会被样式系统合并，
  // 'none' 从未被绘制，feDisplacementMap 永远零位移（链上模糊照常 → 看起来像玻璃
  // 但完全没有折射）。必须跨帧：双 requestAnimationFrame（或定时器）分开两帧写。
  React.useEffect(() => {
    if (!svgLens) return
    const srcs = [lensMap, indMap].filter(Boolean)
    if (srcs.length === 0) return
    let loaded = 0
    const rafs = []
    const repaintEl = (el, u) => {
      if (!el || !el.style) return
      el.style.backdropFilter = 'none'
      // 双 rAF：保证 'none' 先被绘制一帧，下一帧再写回 url，filter 必然重新执行
      rafs.push(
        requestAnimationFrame(() => {
          rafs.push(
            requestAnimationFrame(() => {
              el.style.backdropFilter = u
            })
          )
        })
      )
    }
    const repaint = () => {
      repaintEl(glassRef.current, `url(#${lensFilterId})`)
      repaintEl(indicatorRef.current, `url(#${indFilterId})`)
    }
    for (const src of srcs) {
      const img = new Image()
      img.onload = () => {
        if (++loaded >= srcs.length) {
          setTimeout(repaint, 30)
          setTimeout(repaint, 150)
        }
      }
      img.src = src
    }
    return () => {
      rafs.forEach(id => cancelAnimationFrame(id))
    }
  }, [svgLens, lensMap, indMap, lensFilterId, indFilterId])

  // 长按（原版 InteractiveHighlight spring(0.5f, 300f)），一切随 progress ramp：
  //   lens(10dp*p, 14dp*p)   折射 0 → 满（静止完全无折射）
  //   highlight alpha 0.5*p   白色 45° 方向高光
  //   shadow alpha p          外阴影 24dp 半径 / 4dp 偏移 / Black@0.1
  //   innerShadow 8dp*p       内阴影 alpha 0.3*p
  //   暗化 0.1*(1-p) 淡出 + Black@0.03*p 淡入（原版 onDrawSurface）
  //   指示器 ×1.393（56→78dp，超出底栏）+ 被按 tab 内容 ×1.2
  // 蓝色不参与 ramp：选中项图标+文字恒为 accent 蓝（原版 fgTexture 蓝色 tint 掩膜）
  const applyFrame = React.useCallback((p, x) => {
    const geo = geoRef.current || { indW: 0, GLASS_H: 56, GLASS_PAD: 4 }
    const { indW, GLASS_H, GLASS_PAD } = geo
    const ind = indicatorRef.current
    if (ind) {
      // 放大必须改几何尺寸（width/height/top/left），不能靠 transform: scale()：
      // Chromium 对带 transform 缩放的 backdrop-filter 按缩放前尺寸裁剪采样区，
      // 溢出边缘就没有折射。几何尺寸围绕中心放大，backdrop 采样随平移完整保留。
      const grow = (78 / 56 - 1) * p // 0 → ×1.393
      const w = indW * (1 + grow)
      const h = GLASS_H * (1 + grow)
      const dl = (w - indW) / 2
      const dt = (h - GLASS_H) / 2
      ind.style.left = `${GLASS_PAD - dl}px`
      ind.style.top = `${GLASS_PAD - dt}px`
      ind.style.width = `${w}px`
      ind.style.height = `${h}px`
      ind.style.borderRadius = `${h / 2}px`
      ind.style.transform = `translateX(${x}px)`
      ind.style.boxShadow =
        p > 0.004
          ? `0 ${(4 * p).toFixed(1)}px ${(24 * p).toFixed(1)}px rgba(0,0,0,${(0.1 * p).toFixed(3)}), inset 0 ${(8 * p).toFixed(1)}px ${(8 * p).toFixed(1)}px rgba(0,0,0,${(0.3 * p).toFixed(3)})`
          : 'none'
      // 位移图随几何拉伸铺满放大区域：放大边缘的折射也因此完整
      const feImg = indFeImgRef.current
      if (feImg) {
        feImg.setAttribute('width', w)
        feImg.setAttribute('height', h)
      }
      // 折射随按压 ramp：静止 scale=0（feDisplacementMap 空操作）
      const disp = indDispRef.current
      if (disp) {
        disp.setAttribute('scale', (IND_MAX_MAG * 2 * p).toFixed(1))
      }
    }
    // 原版 onDrawSurface 两层覆盖：暗化淡出 + 按压黑 3% 淡入
    const dim = indDimRef.current
    if (dim) dim.style.opacity = (0.1 * (1 - p)).toFixed(3)
    const dark = indDarkRef.current
    if (dark) dark.style.opacity = (0.03 * p).toFixed(3)
    // 原版 Highlight.Default.copy(alpha=0.5*p)：白色 45° 方向性高光
    const hi = indHiRef.current
    if (hi) hi.style.opacity = (0.5 * p).toFixed(3)
    // 去锯齿模糊（原版 fgTexture LINEAR 采样的软化）：feGaussianBlur 随按压 ramp，
    // 静止 p=0 时 stdDeviation=0 完全无模糊。不能放独立 div —— 半透明模糊层
    // 是"未模糊内容+模糊内容"的重影，不是真模糊
    const blur = indBlurRef.current
    if (blur) {
      blur.setAttribute('stdDeviation', (0.8 * p).toFixed(2))
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
    // 原版 beginTabDrag：按下哪个 tab，指示器就弹簧滑向哪个 tab 并开始放大；
    // 拖动基线也是被按 tab（原版 dragTab: newTarget = startTabIndex + delta/tabW）
    const rect = containerRef.current && containerRef.current.getBoundingClientRect()
    if (rect) {
      const idx = Math.max(0, Math.min(n - 1, Math.floor((e.clientX - rect.left - GLASS_PAD) / tabW)))
      st.pxTarget = idx * tabW
      st.indX0 = idx * tabW
      setVisualIdx(idx)
    }
    startPressLoop()

    const move = (ev) => {
      if (ev.pointerId !== st.pointerId) return
      const dx = ev.clientX - st.startX
      const dy = ev.clientY - st.startY
      if (!st.dragging) {
        // 横向主导且超过 14px 才算拖动：按住时的微漂移不取消长按（原版行为）
        if (Math.abs(dx) < 14 || Math.abs(dx) < Math.abs(dy) * 1.5) return
        st.dragging = true
        // 拖动时保持放大跟手（原版：指示器随手指移动且持续放大，不缩回）
        st.target = 1
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
      st.target = 0
      startPressLoop()
    }

    st.move = move
    st.release = release
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', release)
    window.addEventListener('pointercancel', release)
  }, [indW, GLASS_PAD, followIndicator, animateIndicatorTo, setVisualIdx, startPressLoop])

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
  // 1:1 原版：选中项图标+文字染 accent 蓝（fgTexture tint 掩膜），
  // 指示器胶囊全透明，静止仅 10% 暗化，按压时折射/高光/阴影 ramp + ×1.393 放大
  if (svgLens) {
    const accent = isDarkMode ? ACCENT_DARK : ACCENT_LIGHT
    const contentColor = isDarkMode ? '#ffffff' : '#000000'
    const dimColor = isDarkMode ? '#ffffff' : '#000000'
    const textHalo = isDarkMode ? '0 1px 2px rgba(0,0,0,0.45)' : '0 1px 2px rgba(255,255,255,0.35)'
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
              {/* 容器玻璃：原版 lens(24dp,-24dp) + blur(8dp) + saturate(1.5)，恒定不随按压变 */}
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
              {/* 指示器透镜：原版 lens(10dp*p, 14dp*p)，scale 随按压 0→28 逐帧 ramp */}
              <filter id={indFilterId} colorInterpolationFilters='sRGB'>
                <feImage
                  ref={indFeImgRef}
                  href={indMap}
                  x={0}
                  y={0}
                  width={indW}
                  height={GLASS_H}
                  result='map'
                  preserveAspectRatio='none'
                />
                <feDisplacementMap
                  ref={indDispRef}
                  in='SourceGraphic'
                  in2='map'
                  scale={0}
                  xChannelSelector='R'
                  yChannelSelector='G'
                />
                {/* 去锯齿（原版 fgTexture LINEAR 采样的软化）：stdDeviation 随按压
                    ramp（applyFrame），静止 0 = 完全无模糊 */}
                <feGaussianBlur ref={indBlurRef} stdDeviation={0} />
                <feColorMatrix type='saturate' values='1.0' />
              </filter>
            </svg>
            {/* 玻璃底板：只能用 backdropFilter: url(#lens) 折射。
                绝不能同时写 -webkit-backdrop-filter: blur(...) —— Chromium 中这两者
                是同一属性的别名，-webkit 在后会覆盖 url()，导致位移全部失效，永远只剩纯模糊 */}
            <div
              ref={glassRef}
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: `${CONTAINER_H / 2}px`,
                backdropFilter: `url(#${lensFilterId})`,
                background: isDarkMode ? 'rgba(18,18,18,0.32)' : 'rgba(250,250,250,0.28)',
                boxShadow: isDarkMode
                  ? 'inset 0 1px 0 rgba(255,255,255,0.12), inset 0 -1px 0 rgba(0,0,0,0.25), 0 8px 32px rgba(0,0,0,0.4)'
                  : 'inset 0 1px 0 rgba(255,255,255,0.6), inset 0 -1px 0 rgba(255,255,255,0.2), 0 8px 32px rgba(0,0,0,0.18)',
              }}
            />
            {/* 固定文字层（原版 Layer 2 tab content，z=1）：所有 tab 的 icon+label
                固定在各自槽位，永不移动 —— 指示器与文字完全独立（原版 fgTexture
                绑定固定 rect）。选中项 accent 蓝，其余 contentColor。位于折射
                指示器（z=2）之下，被其 backdrop 采样 → 指示器滑到哪、折射哪里的
                文字（原版 sampleIndicatorBackdrop 步骤 4 按固定 rect mix 蓝色）。
                backdrop-filter 输出替代原背景 → 指示器区域单份折射文字，无重影 */}
            <div style={{ position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none' }}>
              {tabs.map((tab, i) => {
                const isActive = visualIdxState === i
                return (
                  <div
                    key={i}
                    style={{
                      position: 'absolute',
                      top: GLASS_PAD,
                      left: GLASS_PAD + i * indW,
                      width: indW,
                      height: GLASS_H,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 2,
                      color: isActive ? accent : contentColor,
                      textShadow: textHalo,
                    }}>
                    <svg
                      style={{ width: ICON_SIZE, height: ICON_SIZE, filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.25))' }}
                      viewBox='0 0 24 24'
                      fill='currentColor'>
                      <path d={tab.icon} />
                    </svg>
                    <span style={{ fontSize: FONT_SIZE, fontWeight: 600, whiteSpace: 'nowrap' }}>
                      {tab.label}
                    </span>
                  </div>
                )
              })}
            </div>
            {/* 透明透镜指示器（原版 Layer 3，z=2）：独立滑动/放大（文字层不动）。
                backdrop = 玻璃底板 + 固定文字层，折射位移作用于被覆盖的文字 ——
                长按放大时文字随镜头放大弯折；静止时透镜无位移（scale=0），文字
                原样透出。backdrop-filter 输出覆盖原背景 → 无黑蓝重影 */}
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
                zIndex: 2,
                pointerEvents: 'none',
                transformOrigin: 'center',
                willChange: 'transform',
              }}>
              {/* 原版 onDrawSurface：暗化 dimColor@0.1（静止）→ 0（按压） */}
              <div
                ref={indDimRef}
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: 'inherit',
                  background: dimColor,
                  opacity: 0.1,
                }}
              />
              {/* 原版 onDrawSurface 第二层：Black@0.03*progress（按压淡入） */}
              <div
                ref={indDarkRef}
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: 'inherit',
                  background: '#000000',
                  opacity: 0,
                }}
              />
              {/* 原版 Highlight.Default.copy(alpha=0.5*p)：白色 45° 方向性边缘高光 */}
              <div
                ref={indHiRef}
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: 'inherit',
                  background:
                    'linear-gradient(135deg, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.2) 42%, rgba(255,255,255,0) 72%)',
                  opacity: 0,
                }}
              />
            </div>
            {/* 点击层（z=3）：纯透明按钮，仅承载点击区域与手势 —— 文字渲染全部
                在固定文字层（z=1），点击元素不含任何可见内容 */}
            <div className='absolute inset-0 flex h-full' style={{ zIndex: 3 }}>
              {tabs.map((tab, i) => (
                <button
                  key={i}
                  type='button'
                  onClick={() => handleTabSelect(i)}
                  aria-label={tab.label}
                  className='flex-1 relative cursor-pointer'
                  style={{ background: 'transparent', border: 'none', padding: 0, WebkitTapHighlightColor: 'transparent' }}
                />
              ))}
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
              className='flex flex-col items-center gap-1 px-3 py-1 text-xs transition-colors'
              style={{ color: activeTab === idx ? (isDarkMode ? ACCENT_DARK : ACCENT_LIGHT) : undefined }}
            >
              <svg className={`w-5 h-5 ${activeTab === idx ? '' : 'text-gray-500 dark:text-gray-400'}`} viewBox='0 0 24 24' fill='currentColor'>
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
