// @ts-nocheck
'use client'

import * as React from 'react'
import { useRouter } from 'next/router'
import { useGlobal } from '@/lib/global'
import { siteConfig } from '@/lib/config'
import { generateCapsuleLensMap, generateDispersedLensMaps } from './capsuleLensMap'
import { getIconPath } from './iconMap'
import SmartLink from '@/components/SmartLink'
import CONFIG from '../config'

// SVG 透镜底栏（backdrop-filter: url(#feDisplacementMap)，折射真实页面内容）。
// 仅 Chromium 支持 url() 引用 SVG filter；Safari/Firefox 回退到 CSS 玻璃底栏。
// 容器玻璃参数为长期调校值（blur 1.4 / band 18 / mag 14 / saturate 1.35），
// 指示器按压 ramp 1:1 对齐原版 liquid-glass（含 Goose 版 liquid-glass.js）：
//   lens(10dp*p, 14dp*p) + 色散(chromaticAberration) + 0.5dp 描边高光 + 外阴影/内阴影，
//   表面全透明（静止仅 10% 暗化层）；蓝色 = 选中 tab 图标+文字直接染 accent
//   （原版 fgTexture tint 掩膜，指示器 backdrop 采样固定文字层 → 折射里带蓝）。
const SVG_LENS_ENABLED = true
// 容器透镜环带宽度（px）与最大位移（px）
const LENS_REFRACTION_H = 18
const LENS_MAX_MAG = 14
// 指示器透镜：原版 lens(refractionHeight 10dp, refractionAmount -14dp)，随按压 ramp。
// 只折射边缘环带，胶囊内部原样透出背景（参考图里指示器中间是干净的一块）。
// dp 值按 GLASS_H/56 换算成当前尺寸下的 px（桌面端底栏更大）
const IND_REFRACTION_DP = 10
const IND_AMOUNT_DP = 14
// 色散（原版 chromaticAberration = true）：位移向量整体乘 dispersionIntensity
//   I = (cx*cy)/(hx*hy)（cx/cy 为元素内坐标，hx/hy 为半宽半高）
//   胶囊两端 |I|→1 时红蓝分离最大 → 参考图里"指示器最左右两端发虚、带彩虹边"
const IND_DISPERSION = 1
// 原版 7 抽样色散（RoundedRectRefractionWithDispersionShaderString，ROYGBV + purple）：
//   采样位置 = refractedScreen + dispersedOffset × f，f ∈ {1, 2/3, 1/3, 0, -1/3, -2/3, -1}
//   refractedScreen 已含基础折射位移 → 第 k 张位移图的向量 = base × (1 + I × f_k)
//   通道加权（每通道权重和 = 1）：
//     R = (t0 + t1 + t2)/3.5 + t6/7
//     G = t1/7 + (t2 + t3 + t4)/3.5
//     B = (t4 + t5 + t6)/3
// 每个通道都是 3 个不同偏移抽样的平均 —— 这才是两端"发虚"（不只是错位）的来源。
// 注意 blue 抽样（f = -2/3）原版只取 B 通道，G 权重为 0（否则绿通道总和 > 1，整体偏绿）
const DISP_TAPS = [
  { f: 1, w: [1 / 3.5, 0, 0] }, // red
  { f: 2 / 3, w: [1 / 3.5, 1 / 7, 0] }, // orange
  { f: 1 / 3, w: [1 / 3.5, 1 / 3.5, 0] }, // yellow
  { f: 0, w: [0, 1 / 3.5, 0] }, // green
  { f: -1 / 3, w: [0, 1 / 3.5, 1 / 3] }, // cyan
  { f: -2 / 3, w: [0, 0, 1 / 3] }, // blue
  { f: -1, w: [1 / 7, 0, 1 / 3] } // purple
]
// 色散位移图的光栅分辨率倍率：位移场平滑，降采样只是换更粗的采样网格，
// 编码值仍是「元素 px」单位，feImage 拉伸铺满元素后视觉无损，光栅像素数降到 1/4
const IND_MAP_RASTER_SCALE = 0.5
// 固定标签层的容器级缩放：原版 containerScale = 1 + 16dp / containerW * pressProgress
const IND_CONTAINER_GROW_DP = 16
// 内部位移下限（占 maxMag 比例）：容器专用 —— 底栏中间会留出一块 40px 高完全
// 不动、形状像空心椭圆的死角（tab 文字正好整块落在里面）。0.25 让中间保留
// 3.5px 位移：整块玻璃都在折射，且剖面两端斜率为 0，不会出现接缝或折痕。
const LENS_FLOOR = 0.25
// 原版强调色：light #0088FF / dark #0091FF
const ACCENT_LIGHT = '#0088FF'
const ACCENT_DARK = '#0091FF'
// 静止态几何要在首帧绘制前写好（否则指示器会先闪在错误槽位）；
// useLayoutEffect 在服务端渲染会告警，按环境二选一
const useLayoutSync = typeof window === 'undefined' ? React.useEffect : React.useLayoutEffect

// --- 长按折射弹簧（原版 InteractiveHighlight.kt spring(0.5f, 300f)） ---
const SPRING_K = 300
const SPRING_ZETA = 0.5
const SPRING_OMEGA_N = Math.sqrt(SPRING_K)
const SPRING_OMEGA_D = SPRING_OMEGA_N * Math.sqrt(1 - SPRING_ZETA * SPRING_ZETA)
const SPRING_THRESHOLD = 0.003
// 指示器几何缩放用另一条弹簧（原版 DampedDragAnimation scaleX: spring k=250, ζ=0.6），
// 与 pressProgress（临界阻尼 ωn=√1000）分开 —— 缩放会轻微过冲，折射/高光则快速收束
const SCALE_K = 250
const SCALE_ZETA = 0.6
const SCALE_OMEGA_N = Math.sqrt(SCALE_K)
const SCALE_OMEGA_D = SCALE_OMEGA_N * Math.sqrt(1 - SCALE_ZETA * SCALE_ZETA)
// 原版 pressedScale = 78/56
const IND_PRESSED_SCALE = 78 / 56

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

function springStepScale(current, velocity, target, dt) {
  const x0 = current - target
  const v0 = velocity
  const decay = Math.exp(-SCALE_ZETA * SCALE_OMEGA_N * dt)
  const cosWd = Math.cos(SCALE_OMEGA_D * dt)
  const sinWd = Math.sin(SCALE_OMEGA_D * dt)
  const b0 = (v0 + SCALE_ZETA * SCALE_OMEGA_N * x0) / SCALE_OMEGA_D
  const offset = x0 * decay * cosWd + b0 * decay * sinWd
  const newVel =
    -SCALE_ZETA * SCALE_OMEGA_N * offset +
    decay * (-x0 * SCALE_OMEGA_D * sinWd + b0 * SCALE_OMEGA_D * cosWd)
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
  const indMapImgRefs = React.useRef([])
  const indDispRefs = React.useRef([])
  const indDimRef = React.useRef(null)
  const indDarkRef = React.useRef(null)
  const indHiRef = React.useRef(null)
  // 固定标签层：随按压做容器级缩放（原版 containerScale）
  const textLayerRef = React.useRef(null)
  // applyFrame 必须读到最新几何值：useCallback([]) 会捕获首帧（isDesktop=false、
  // canvasW 初值）的尺寸，按压/路由动画落定后会把指示器写回错误的小尺寸
  const geoRef = React.useRef(null)
  const pressRef = React.useRef({ progress: 0, velocity: 0, target: 0, sc: 1, sv: 0, scTarget: 1, px: 0, pv: 0, pxTarget: 0, raf: 0, last: 0, pointerId: null, startX: 0, startY: 0, indX0: 0, dragging: false, release: null, move: null })
  const [canvasW, setCanvasW] = React.useState(380)
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

  // 蓝色归属 = 指示器实际位置（applyFrame 里按 x 推导，不是点击瞬间的目标槽位）：
  // 指示器滑到哪一格，那一格的字才染 accent。初值取路由对应的槽位，深链首帧即正确
  const [visualIdxState, setVisualIdxState] = React.useState(activeTab)

  // 尺寸测量做防抖：拖拽窗口时 ResizeObserver 每帧触发，位移图会被反复重光栅
  // （模块缓存按尺寸精确命中不了）。停手 120ms 后再更新一次，避免几十次无效光栅
  React.useEffect(() => {
    if (!containerRef.current) return
    let timer = 0
    let last = -1
    const updateWidth = () => {
      if (!containerRef.current) return
      const w = containerRef.current.offsetWidth
      if (w === last) return
      last = w
      if (timer) clearTimeout(timer)
      timer = window.setTimeout(() => setCanvasW(w), 120)
    }
    const w0 = containerRef.current.offsetWidth
    last = w0
    setCanvasW(w0)
    const observer = new ResizeObserver(updateWidth)
    observer.observe(containerRef.current)
    return () => {
      if (timer) clearTimeout(timer)
      observer.disconnect()
    }
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
  // 容器位移图：静止也在用（底栏玻璃本体），挂载即建。模块级缓存让 resize /
  // 路由切换 / 重挂载复用同一张图，不重复光栅
  const lensMap = React.useMemo(
    () => (svgLens ? generateCapsuleLensMap(canvasW, CONTAINER_H, LENS_REFRACTION_H, LENS_MAX_MAG, LENS_FLOOR) : ''),
    [svgLens, canvasW, CONTAINER_H]
  )
  const lensFilterId = React.useMemo(
    () => `liquid-tabs-lens-${Math.round(canvasW)}-${CONTAINER_H}`,
    [canvasW, CONTAINER_H]
  )
  // 指示器透镜参数：原版 dp 值按当前 GLASS_H 等比换算
  const indRefH = (IND_REFRACTION_DP * GLASS_H) / 56
  const indMag = (IND_AMOUNT_DP * GLASS_H) / 56
  const indFilterId = React.useMemo(
    () => `liquid-tabs-ind-${Math.round(indW)}-${Math.round(GLASS_H)}`,
    [indW, GLASS_H]
  )
  const indMapsKey = `${Math.round(indW)}x${Math.round(GLASS_H)}`
  // 滤镜 id / 几何 key 都放进 ref：syncIndFilter 是稳定回调，按压逐帧调用时
  // 不能依赖闭包里的旧 id
  const indFilterIdRef = React.useRef('')
  const indMapsKeyRef = React.useRef('')
  const indMapsDomKeyRef = React.useRef('')
  indFilterIdRef.current = indFilterId
  indMapsKeyRef.current = indMapsKey
  geoRef.current = { indW, GLASS_H, GLASS_PAD, CONTAINER_H, canvasW, indMag }

  // --- 指示器位移图：懒加载 ---
  // 7 张色散图只在按压时才需要（静止 scale = 0，原版静止零折射），所以不在首屏
  // 生成：等页面空闲（或鼠标靠近 / 首次按下底栏）才光栅 + 预解码。
  // 首屏与路由切换完全不付这笔开销。
  const [indMaps, setIndMaps] = React.useState(null)
  const indMapsRef = React.useRef({ key: '', ready: false, building: false })
  const ensureIndMaps = React.useCallback(() => {
    if (!svgLens || indW <= 4) return
    const st = indMapsRef.current
    if (st.key === indMapsKey && (st.ready || st.building)) return
    st.key = indMapsKey
    st.ready = false
    st.building = true
    const taps = generateDispersedLensMaps(
      indW,
      GLASS_H,
      GLASS_H / 2,
      indRefH,
      indMag,
      IND_DISPERSION,
      DISP_TAPS.map(t => t.f),
      IND_MAP_RASTER_SCALE
    )
    // feImage 是 data URL，必须等解码完成再挂 url()：未解码时 feDisplacementMap
    // 把透明像素当成零位移向量，字形会被甩出画布
    let loaded = 0
    const done = () => {
      if (++loaded < taps.length) return
      if (indMapsRef.current.key !== indMapsKey) return
      indMapsRef.current.building = false
      indMapsRef.current.ready = true
      setIndMaps({ key: indMapsKey, taps })
    }
    taps.forEach(u => {
      const im = new Image()
      im.onload = done
      im.onerror = done
      im.src = u
    })
  }, [svgLens, indW, GLASS_H, indRefH, indMag, indMapsKey])

  // 空闲预热：首屏渲染完再建图，不抢首屏主线程
  React.useEffect(() => {
    if (!svgLens) return
    let cancelled = false
    const warm = () => {
      if (!cancelled) ensureIndMaps()
    }
    const hasIdle = typeof requestIdleCallback === 'function'
    const handle = hasIdle ? requestIdleCallback(warm, { timeout: 2500 }) : setTimeout(warm, 1500)
    return () => {
      cancelled = true
      if (hasIdle) cancelIdleCallback(handle)
      else clearTimeout(handle)
    }
  }, [svgLens, ensureIndMaps])

  // 滤镜只在按压期间挂载：静止时原版 refractionHeight × progress = 0、无 blur、
  // 无高光 —— 常挂 backdrop-filter 只会让底栏每次滚动重绘都多跑一遍 20+ 图元的
  // 滤镜链。挂载前提是位移图已解码（ready）且 href 已随 state 提交进 DOM。
  const syncIndFilter = React.useCallback(on => {
    const st = indMapsRef.current
    const ready =
      st.ready && st.key === indMapsKeyRef.current && indMapsDomKeyRef.current === st.key
    const ind = indicatorRef.current
    if (ind) {
      const want = on && ready ? `url(#${indFilterIdRef.current})` : 'none'
      if (ind.style.backdropFilter !== want) ind.style.backdropFilter = want
    }
  }, [])

  // 换图后必须跨帧重绘：feImage 的 data URL 解码完成后 Chromium 不会重跑已挂载的
  // backdrop-filter，必须让 'none' 真实绘制一帧再写回 url()（同一任务内同步
  // none → 回流 → url 会被样式系统合并，'none' 从未被绘制 → 位移永远为零）
  const repaintInd = React.useCallback(() => {
    const ind = indicatorRef.current
    if (ind) ind.style.backdropFilter = 'none'
    requestAnimationFrame(() => {
      requestAnimationFrame(() => syncIndFilter(true))
    })
  }, [syncIndFilter])

  // 图已提交进 DOM：正在按压就补挂滤镜（跨帧重绘），否则做一次「挂-摘」预热 ——
  // 静止时 scale = 0，挂上滤镜的渲染结果与不挂完全一致（肉眼不可见），但 Chromium
  // 会因此提前解码位移图并编译滤镜程序，首次按压不掉帧
  React.useEffect(() => {
    indMapsDomKeyRef.current = indMaps ? indMaps.key : ''
    if (!svgLens || !indMaps || indMaps.key !== indMapsKey) {
      syncIndFilter(false)
      return
    }
    const st = pressRef.current
    if (st.target > 0 || st.progress > 0.001) {
      repaintInd()
      return
    }
    const ind = indicatorRef.current
    if (ind) ind.style.backdropFilter = `url(#${indFilterId})`
    const t = setTimeout(() => {
      const s = pressRef.current
      if (s.target <= 0 && s.progress <= 0.001) syncIndFilter(false)
    }, 250)
    return () => clearTimeout(t)
  }, [indMaps, indMapsKey, svgLens, indFilterId, repaintInd, syncIndFilter])

  // 容器位移图：data URL 异步解码，解码完必须跨帧重绘一次才会生效
  React.useEffect(() => {
    if (!svgLens || !lensMap) return
    let cancelled = false
    const rafs = []
    const repaint = () => {
      const el = glassRef.current
      if (!el || cancelled) return
      el.style.backdropFilter = 'none'
      rafs.push(
        requestAnimationFrame(() => {
          rafs.push(
            requestAnimationFrame(() => {
              if (!cancelled) el.style.backdropFilter = `url(#${lensFilterId})`
            })
          )
        })
      )
    }
    const img = new Image()
    img.onload = () => {
      if (cancelled) return
      setTimeout(repaint, 30)
      setTimeout(repaint, 150)
    }
    img.src = lensMap
    return () => {
      cancelled = true
      rafs.forEach(id => cancelAnimationFrame(id))
    }
  }, [svgLens, lensMap, lensFilterId])

  // 长按（原版 InteractiveHighlight spring(0.5f, 300f)），一切随 progress ramp：
  //   lens(10dp*p, 14dp*p) + 7 抽样色散   折射 0 → 满（静止完全无折射）
  //   highlight alpha p             0.5dp 内侧描边高光（45° 强度调制）
  //   shadow alpha p                外阴影 24dp 半径 / 4dp 偏移 / Black@0.1
  //   innerShadow 8dp*p             内阴影 alpha 0.15*p
  //   暗化 0.1*(1-p) 淡出 + Black@0.03*p 淡入（原版 onDrawSurface）
  //   指示器 ×1.393（56→78dp，超出底栏）；蓝色标签内容 ×1.2；固定标签层 ×containerScale
  const applyFrame = React.useCallback((p, x, sc) => {
    const geo = geoRef.current || { indW: 0, GLASS_H: 56, GLASS_PAD: 4, CONTAINER_H: 64, canvasW: 380, indMag: 14 }
    const { indW, GLASS_H, GLASS_PAD, CONTAINER_H, canvasW, indMag } = geo
    const scale = sc == null ? 1 + (IND_PRESSED_SCALE - 1) * p : sc
    // 容器级缩放（原版 containerScale）：固定文字层与蓝色内容层共用同一个值，
    // 否则按压时两侧标签外移而蓝色层不动 → 蓝色文字看着比邻居偏移
    const glassW = Math.max(1, canvasW - 2 * GLASS_PAD)
    const cs = 1 + (IND_CONTAINER_GROW_DP / glassW) * p
    const ind = indicatorRef.current
    // 指示器几何（蓝色内容层反平移要用到）
    let w = indW
    let h = GLASS_H
    let dl = 0
    let dt = 0
    if (ind) {
      // 放大必须改几何尺寸（width/height/top/left），不能靠 transform: scale()：
      // Chromium 对带 transform 缩放的 backdrop-filter 按缩放前尺寸裁剪采样区，
      // 溢出边缘就没有折射。几何尺寸围绕中心放大，backdrop 采样随平移完整保留。
      const grow = scale - 1 // 0 → ×1.393（78/56）
      w = indW * (1 + grow)
      h = GLASS_H * (1 + grow)
      dl = (w - indW) / 2
      dt = (h - GLASS_H) / 2
      ind.style.left = `${GLASS_PAD - dl}px`
      ind.style.top = `${GLASS_PAD - dt}px`
      ind.style.width = `${w}px`
      ind.style.height = `${h}px`
      ind.style.borderRadius = `${h / 2}px`
      ind.style.transform = `translateX(${x}px)`
      // 原版外阴影 Shadow.Default(radius 24dp, offsetY 4dp, Black@0.1)，只有 alpha 随按压
      // 内阴影 InnerShadow(radius 8dp, offsetY 8dp, Black@0.15)，radius/offset/alpha 全随按压
      ind.style.boxShadow =
        p > 0.004
          ? `0 4px 24px rgba(0,0,0,${(0.1 * p).toFixed(3)}), inset 0 ${(8 * p).toFixed(1)}px ${(8 * p).toFixed(1)}px rgba(0,0,0,${(0.15 * p).toFixed(3)})`
          : 'none'
      // 位移图铺满放大区域；7 张色散图的归一化都是 indMag*(1+|dispersion|)，
      // 所以 7 个 feDisplacementMap 共用同一个 scale = 2*norm*p
      // （每张图里已烘焙好自己的 base*(1 + I*f)，见 generateDispersedLensMaps）
      indMapImgRefs.current.forEach(img => {
        if (img) {
          img.setAttribute('width', w)
          img.setAttribute('height', h)
        }
      })
      const dispScale = (2 * indMag * (1 + IND_DISPERSION) * p).toFixed(2)
      indDispRefs.current.forEach(el => {
        if (el) el.setAttribute('scale', dispScale)
      })
    }
    // 固定标签层：原版 containerScale = 1 + 16dp/containerW * pressProgress，
    // 围绕容器中心整体轻微放大
    const textLayer = textLayerRef.current
    if (textLayer) textLayer.style.transform = `scale(${cs.toFixed(4)})`
    // 蓝色归属由指示器实际位置决定（而不是点击瞬间的目标槽位）：
    // 指示器滑到哪一格，那一格的字才染 accent。指示器是 backdrop-filter 采样
    // 这层文字 → 蓝色跟着一起被折射
    setVisualIdx(Math.round(x / Math.max(1, indW)))
    // 原版 onDrawSurface 两层覆盖：暗化淡出 + 按压黑 3% 淡入
    const dim = indDimRef.current
    if (dim) dim.style.opacity = (0.1 * (1 - p)).toFixed(3)
    const dark = indDarkRef.current
    if (dark) dark.style.opacity = (0.03 * p).toFixed(3)
    // 原版 Highlight.Default.copy(alpha=progress)：0.5dp 内侧描边环，
    // 白色 × |dot(SDF 梯度, 45°)| —— 直边上恒为 |cos45°|=0.707，圆角弧中段最亮
    const hi = indHiRef.current
    if (hi) hi.style.opacity = (0.5 * p).toFixed(3)
  }, [])

  // 三条弹簧逐帧驱动：progress（折射/高光 ramp，临界阻尼）+ sc（几何缩放，欠阻尼）
  // + px（指示器位置），无 CSS transition，避免互相打断
  const startPressLoop = React.useCallback(() => {
    const st = pressRef.current
    if (st.raf) return
    const idle =
      st.progress === st.target && st.velocity === 0 &&
      st.sc === st.scTarget && st.sv === 0 &&
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
      const settledScale =
        Math.abs(st.scTarget - st.sc) <= SPRING_THRESHOLD &&
        Math.abs(st.sv) <= SPRING_THRESHOLD
      const settledPos =
        Math.abs(st.pxTarget - st.px) <= 0.5 && Math.abs(st.pv) <= 0.5
      if (settledPress && settledScale && settledPos) {
        st.progress = st.target
        st.velocity = 0
        st.sc = st.scTarget
        st.sv = 0
        st.px = st.pxTarget
        st.pv = 0
        indXRef.current = st.px
        applyFrame(st.progress, st.px, st.sc)
        // 回落到静止：摘掉指示器滤镜，滚动时不再为它重跑整条色散链
        if (st.target <= 0) syncIndFilter(false)
        st.raf = 0
        return
      }
      if (!settledPress) {
        const r = springStep1D(st.progress, st.velocity, st.target, dt)
        st.progress = r.current
        st.velocity = r.velocity
      }
      if (!settledScale) {
        const r = springStepScale(st.sc, st.sv, st.scTarget, dt)
        st.sc = r.current
        st.sv = r.velocity
      }
      if (!settledPos) {
        const r = springStep1D(st.px, st.pv, st.pxTarget, dt)
        st.px = r.current
        st.pv = r.velocity
        indXRef.current = st.px
      }
      applyFrame(st.progress, st.px, st.sc)
      st.raf = requestAnimationFrame(tick)
    }
    st.raf = requestAnimationFrame(tick)
  }, [applyFrame, syncIndFilter])

  // 染蓝的槽位：只有真的换了格才 setState（拖动时每帧调用，避免无谓 re-render）
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
    applyFrame(st.progress, x, st.sc)
  }, [applyFrame])

  // 弹簧动画到目标位置（拖动 snap / 路由切换）
  const animateIndicatorTo = React.useCallback((x) => {
    const st = pressRef.current
    st.pxTarget = x
    startPressLoop()
  }, [startPressLoop])

  // 路由驱动指示器位置（拖动/点击之外的来源）。染色槽位由 applyFrame 按指示器
  // 实际位置推导 —— 指示器滑到哪一格，那一格的字才变蓝
  React.useEffect(() => {
    if (!svgLens || indW <= 4) return
    animateIndicatorTo(activeTab * indW)
  }, [svgLens, activeTab, indW, animateIndicatorTo])

  // 静止态也要写一遍几何：首屏弹簧本就到位，startPressLoop 判定 idle 直接返回，
  // applyFrame 一次都没跑 → 指示器停在 JSX 初值（left = GLASS_PAD，无 translateX），
  // 深链（如 /en 直接刷新）会先闪在第一个槽位。这里在首帧绘制前补一次同步
  useLayoutSync(() => {
    if (!svgLens || indW <= 4) return
    const st = pressRef.current
    if (st.raf) return
    st.px = st.pxTarget = activeTab * indW
    st.pv = 0
    st.progress = st.target = 0
    st.velocity = 0
    st.sc = st.scTarget = 1
    st.sv = 0
    indXRef.current = st.px
    applyFrame(0, st.px, 1)
  }, [svgLens, indW, activeTab, applyFrame])

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
    // 几何缩放走独立弹簧（欠阻尼 ζ=0.6，会轻微过冲），目标必须显式设置：
    // scTarget 恒为 1 时缩放弹簧永远静止，指示器只折射不放大（超出底栏那一下没了）
    st.scTarget = IND_PRESSED_SCALE
    // 首次按下时若位移图还没建好（空闲预热尚未跑），立刻补建；
    // 挂滤镜的时机由 syncIndFilter 把关（图没解码好就保持 'none'）
    ensureIndMaps()
    syncIndFilter(true)
    // 原版 beginTabDrag：按下哪个 tab，指示器就弹簧滑向哪个 tab 并开始放大；
    // 拖动基线也是被按 tab（原版 dragTab: newTarget = startTabIndex + delta/tabW）
    const rect = containerRef.current && containerRef.current.getBoundingClientRect()
    if (rect) {
      const idx = Math.max(0, Math.min(n - 1, Math.floor((e.clientX - rect.left - GLASS_PAD) / tabW)))
      st.pxTarget = idx * tabW
      st.indX0 = idx * tabW
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
      st.scTarget = 1
      startPressLoop()
    }

    st.move = move
    st.release = release
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', release)
    window.addEventListener('pointercancel', release)
  }, [indW, GLASS_PAD, followIndicator, animateIndicatorTo, startPressLoop, ensureIndMaps, syncIndFilter])

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
    if (tab.subMenus.length > 0) {
      setSubMenuOpen(prev => prev === i ? null : i)
    } else {
      setSubMenuOpen(null)
      routerRef.current.push(tab.href)
    }
  }, [])

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
    // 标签字形（图标 + 文字）：颜色由 currentColor 决定，选中项传 accent
    const glyphContent = (tab) => (
      <>
        <svg
          style={{ width: ICON_SIZE, height: ICON_SIZE, filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.25))' }}
          viewBox='0 0 24 24'
          fill='currentColor'>
          <path d={tab.icon} />
        </svg>
        <span style={{ fontSize: FONT_SIZE, fontWeight: 600, whiteSpace: 'nowrap' }}>{tab.label}</span>
      </>
    )
    const glyphBox = {
      position: 'absolute',
      width: indW,
      height: GLASS_H,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 2
    }
    // 0.5dp 内侧描边环（原版 HighlightModifier.kt：stroke 0.5dp + blur 0.25dp + 裁掉外侧一半）。
    // 用四条 inset 阴影拼出 1px 环：贴边描边跟着 border-radius 走（圆角处自然收弯）。
    // 强度 = |dot(SDF 梯度, 45°)|：直边上梯度恒为轴向 → |cos45°| = 0.707 处处相同，
    // 只有圆角弧中段法线转到 45° 时到 1。四条同亮度的环在圆角处叠加 → 自然形成角点高光。
    // 不用 mask/mask-composite 做渐变环：unprefixed mask 在部分 Chromium 上会静默失效
    // （React 的 style[styleName] = value 对不认识的属性直接变成 expando，不报错）
    const ringStyle = {
      position: 'absolute',
      inset: 0,
      borderRadius: 'inherit',
      pointerEvents: 'none',
      boxShadow: isDarkMode
        ? 'inset 0 1px 0 rgba(255,255,255,0.62), inset 0 -1px 0 rgba(255,255,255,0.62), inset 1px 0 0 rgba(255,255,255,0.62), inset -1px 0 0 rgba(255,255,255,0.62)'
        : 'inset 0 1px 0 rgba(255,255,255,0.80), inset 0 -1px 0 rgba(255,255,255,0.80), inset 1px 0 0 rgba(255,255,255,0.80), inset -1px 0 0 rgba(255,255,255,0.80)',
      opacity: 0
    }
    return (
      <>
        {renderSubMenu()}
        {canvasW > 10 && tabs.length > 0 && (
          <div
            ref={containerRef}
            onPointerDown={handleBarPointerDown}
            onPointerEnter={ensureIndMaps}
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
              {/* 指示器透镜 + 色散：原版 lens(10dp*p, 14dp*p) + chromaticAberration。
                  7 张位移图，第 k 张烘焙的位移向量 = base × (1 + I × f_k)
                  （I = (cx*cy)/(hx*hy) 即原版 dispersionIntensity）：
                  原版采样位置 = refractedScreen + dispersedOffset × f，而
                  refractedScreen 已含基础折射位移，所以 base 必须留在每张图里 ——
                  只烘焙 base×I 的话，两条中轴线 I=0 会完全没有位移。
                  7 个 feDisplacementMap 共用同一 scale，各按原版权重取通道后相加：
                    R = (t0+t1+t2)/3.5 + t6/7；G = t1/7 + (t2+t3+t4)/3.5；B = (t4+t5+t6)/3
                  每个通道由 3 个不同偏移抽样平均而成 → 两端那种发虚的彩虹边。
                  静止 scale = 0（且整条滤镜被摘掉），随按压 0→满 逐帧 ramp。
                  位移图懒加载：图没解码好时不渲染，避免空 href 的 feImage */}
              {indMaps && (
                <React.Fragment>
                  <filter id={indFilterId} colorInterpolationFilters='sRGB'>
                    {DISP_TAPS.map((tap, k) => (
                      <React.Fragment key={k}>
                        <feImage
                          ref={el => (indMapImgRefs.current[k] = el)}
                          href={indMaps.taps[k]}
                          x={0}
                          y={0}
                          width={indW}
                          height={GLASS_H}
                          result={`dmap${k}`}
                          preserveAspectRatio='none'
                        />
                        <feDisplacementMap
                          ref={el => (indDispRefs.current[k] = el)}
                          in='SourceGraphic'
                          in2={`dmap${k}`}
                          scale={0}
                          xChannelSelector='R'
                          yChannelSelector='G'
                          result={`tap${k}`}
                        />
                        <feColorMatrix
                          in={`tap${k}`}
                          type='matrix'
                          values={`${tap.w[0]} 0 0 0 0  0 ${tap.w[1]} 0 0 0  0 0 ${tap.w[2]} 0 0  0 0 0 1 0`}
                          result={`wt${k}`}
                        />
                      </React.Fragment>
                    ))}
                    {/* 7 层相加（k2=k3=1 纯加法）。alpha 行必须是 1 而不是各 1/7：
                        Chromium 的 feColorMatrix 输出按新 alpha 预乘，alpha 取 1/7 时
                        每层贡献只剩 (1/7)·w·C，7 层加完是 C/7（实测指示器整块发黑，
                        rgb(19) vs 背景 rgb(139)）；取 1 时每层贡献 w·C，加完正好 C，
                        alpha 累加到 7 被 clamp 回 1。每通道权重和为 1，不会溢出 */}
                    {DISP_TAPS.slice(1).map((_, i) => (
                      <feComposite
                        key={i}
                        in={i === 0 ? 'wt0' : `sum${i}`}
                        in2={`wt${i + 1}`}
                        operator='arithmetic'
                        k1={0}
                        k2={1}
                        k3={1}
                        k4={0}
                        result={`sum${i + 1}`}
                      />
                    ))}
                  </filter>
                </React.Fragment>
              )}
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
                固定在各自槽位，永不移动（按压时整层按 containerScale 轻微放大）。
                选中项 accent 蓝，其余 contentColor —— 指示器是 backdrop-filter
                采样这层，滑到哪就折射哪一格的字，蓝色跟着一起被折射 */}
            <div
              ref={textLayerRef}
              style={{ position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none', transformOrigin: 'center', willChange: 'transform' }}>
              {tabs.map((tab, i) => {
                const isActive = visualIdxState === i
                return (
                  <div
                    key={i}
                    style={{
                      ...glyphBox,
                      top: GLASS_PAD,
                      left: GLASS_PAD + i * indW,
                      color: isActive ? accent : contentColor,
                      textShadow: textHalo,
                    }}>
                    {glyphContent(tab)}
                  </div>
                )
              })}
            </div>
            {/* 透明透镜指示器（原版 Layer 3，z=2）：独立滑动/放大（文字层不动）。
                backdrop = 玻璃底板 + 固定文字层，折射位移作用于被覆盖的内容 ——
                长按放大时背景随镜头弯折；静止时透镜无位移（scale=0），内容原样透出 */}
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
                // 初始 'none'：位移图懒加载，解码完成后由 syncIndFilter 在按压时挂上。
                // 静止时原版折射为 0，摘掉滤镜可省掉整条色散链的逐帧开销
                backdropFilter: 'none',
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
              {/* 原版 Highlight.Default.copy(alpha=progress)：0.5dp 内侧描边环 */}
              <div ref={indHiRef} style={ringStyle} />
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
