// @ts-nocheck
'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { siteConfig } from '@/lib/config'
import CONFIG from '../config'
import { generateRoundedRectLensMap } from './capsuleLensMap'

let uidCounter = 0

/**
 * 给任意玻璃卡片挂 SVG 透镜折射（backdrop-filter: url(#feDisplacementMap)），
 * 默认参数 = 原版 liquid-glass-webgl Scroll Container 卡片
 * （build-scroll-container.ts：refractionHeight 16dp / refractionAmount -32dp /
 *   无模糊 / 饱和 1.5），静止即满强度边缘折射。
 *
 * - 圆角自动读取元素 computed border-radius（响应式断点切换半径也能跟随）
 * - ResizeObserver 跟随尺寸变化重建位移图
 * - feImage 的 data URL 异步加载后 Chromium 不重跑 backdrop-filter，
 *   每次换图后强制重绘（关-开 backdrop-filter，必须跨帧：'none' 要真实
 *   绘制过一帧再写回 url()，同一任务内同步切换是无效操作）
 * - 仅 Chromium 支持 url() 引用；Safari/Firefox / 触屏设备返回 null，
 *   调用方保留原有 CSS 模糊回退
 */
export function useLensBackdrop({
  refractionHeight = 16,
  maxMag = 32,
  blur = 0,
  saturate = 1.5,
  // 内部下限位移比例。不传 = 读 LIQUID_LENS_FLOOR（默认 0）。
  // floor = 0 → 纯内法线场，**只有边缘 refractionHeight 环带折射，中间完全不动**
  //   —— 这是原版行为（shader 对内部直接早退），1:1 对齐。
  // floor > 0 → 内部切到「指向中心」的径向场，整块向中心轻微放大（观感更明显，但非原版）。
  floor,
} = {}) {
  // 回调 ref + state：卡片折叠/展开时目标元素会整体换掉，
  // useRef 只在首次挂载时被 effect 读到，换元素后透镜会静默失效
  const [el, setEl] = useState(null)
  const elRef = useCallback(node => setEl(node), [])
  const [supported] = useState(() => {
    if (typeof window === 'undefined' || typeof CSS === 'undefined' || !CSS.supports) return false
    // 减少动画偏好：直接退回 CSS blur
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false
    // 触屏端默认【也启用】折射 —— 移动端要的是真折射，不是只有 Blur。
    // 只有把 LIQUID_LENS_TOUCH 显式设为 false 才在触屏退回 CSS blur（低端机省电用）。
    // 注：不用 (pointer: coarse) 判定，触屏笔记本 / 桌面触控屏的主指针也可能是 coarse，
    // 会把整个桌面端误退回模糊。
    if (
      window.matchMedia &&
      window.matchMedia('(hover: none)').matches &&
      !siteConfig('LIQUID_LENS_TOUCH', true, CONFIG)
    ) {
      return false
    }
    try {
      // 用最朴素的 #probe 探测：带具体长 id 的 value 在部分 Chromium 的 CSS.supports
      // 中会返回 false（误判为不支持 → 永远回退 CSS 模糊）。与 BottomTabs 保持一致。
      return CSS.supports('backdrop-filter', 'url(#probe)')
    } catch (e) {
      return false
    }
  })
  const [size, setSize] = useState(null)
  const [radius, setRadius] = useState(16)
  const [filterId] = useState(() => `lens-card-${++uidCounter}`)
  // 可见性门控（PERF.md P0-3）：进视口才挂 url(#...)，离视口置 none。
  // 首页同时存活的透镜从 ~11 降到 2-4，滚出视口的卡片零开销。
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!supported || !el) return
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true)
      return
    }
    // 提前 200px 预挂：回滚进视口时舞步来不及跑完也不会露出无折射的卡片
    const io = new IntersectionObserver(
      entries => {
        for (const e of entries) setVisible(e.isIntersecting)
      },
      { rootMargin: '200px 0px 200px 0px' }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [supported, el])

  useEffect(() => {
    if (!supported || !el) return
    let timer = 0
    const measure = () => {
      const w = Math.round(el.offsetWidth)
      const h = Math.round(el.offsetHeight)
      if (w < 8 || h < 8) return
      const r = parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0
      setSize(prev => {
        if (prev && prev.w === w && prev.h === h) return prev
        return { w, h }
      })
      setRadius(prev => (Math.abs(prev - r) < 0.5 ? prev : r))
    }
    // 尺寸变化防抖 120ms（与底栏口径一致）：拖窗口时 ResizeObserver 每帧触发，
    // 无防抖会反复重光栅位移图并重跑 repaint 舞步，每张卡各跑各的 timer 链（PERF.md P1-3）
    const update = () => {
      if (timer) clearTimeout(timer)
      timer = window.setTimeout(measure, 120)
    }
    measure() // 首测立即执行，避免首屏空窗
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => {
      if (timer) clearTimeout(timer)
      ro.disconnect()
    }
  }, [supported, el])

  // 位移图光栅倍率：0.5 → 像素数降到 1/4（位移场平滑，降采样视觉无损，
  // 见 capsuleLensMap.ts 文件头）。卡片此前落到默认 1，是白付的光栅/采样成本。
  const rasterScale = Number(siteConfig('LIQUID_LENS_RASTER_SCALE', 0.5, CONFIG)) || 0.5
  // floor：调用方显式传入优先，否则读主题配置（默认 0 = 原版行为）
  const floorEff =
    floor == null ? Number(siteConfig('LIQUID_LENS_FLOOR', 0, CONFIG)) || 0 : floor
  const mapUrl = useMemo(() => {
    if (!supported || !size || !visible) return ''
    return generateRoundedRectLensMap(
      size.w,
      size.h,
      radius,
      refractionHeight,
      maxMag,
      floorEff,
      rasterScale
    )
  }, [supported, size, radius, refractionHeight, maxMag, floorEff, visible, rasterScale])

  // 强制重绘：feImage 的 data URL 加载完成后 Chromium 不会自动重跑
  // backdrop-filter，必须等图加载完再关-开切换（过早切换位移不生效）。
  // Chrome 中 -webkit- 与标准 backdrop-filter 是同一属性的别名，必须两者一起
  // 切 'none'→url()，避免样式系统只认到 .glass-card 的 -webkit blur 覆盖位移
  useEffect(() => {
    if (!mapUrl || !el) return
    const url = `url(#${filterId})`
    let cancelled = false
    let t1 = 0
    let t2 = 0
    const setFilter = v => {
      el.style.backdropFilter = v
      el.style.webkitBackdropFilter = v
    }
    const img = new Image()
    img.onload = () => {
      if (cancelled) return
      t1 = window.setTimeout(() => {
        if (cancelled) return
        setFilter('none')
        t2 = window.setTimeout(() => {
          if (cancelled) return
          setFilter(url)
        }, 100)
      }, 50)
    }
    img.src = mapUrl
    return () => {
      cancelled = true
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [mapUrl, filterId, el])

  const filterNode = useMemo(() => {
    if (!mapUrl || !size) return null
    return (
      <svg
        aria-hidden='true'
        width='0'
        height='0'
        style={{ position: 'absolute', pointerEvents: 'none' }}>
        <filter id={filterId} colorInterpolationFilters='sRGB'>
          <feImage
            href={mapUrl}
            x={0}
            y={0}
            width={size.w}
            height={size.h}
            result='map'
            preserveAspectRatio='none'
          />
          <feDisplacementMap
            in='SourceGraphic'
            in2='map'
            scale={maxMag * 2}
            xChannelSelector='R'
            yChannelSelector='G'
          />
          {blur > 0 && <feGaussianBlur stdDeviation={blur} />}
          {saturate !== 1 && <feColorMatrix type='saturate' values={String(saturate)} />}
        </filter>
      </svg>
    )
  }, [mapUrl, size, filterId, maxMag, blur, saturate])

  const style = useMemo(
    () =>
      mapUrl
        ? {
            backdropFilter: `url(#${filterId})`,
            // 与标准属性同值一起写，覆盖 .glass-card 等类的 -webkit blur，确保位移生效
            WebkitBackdropFilter: `url(#${filterId})`
          }
        : null,
    [mapUrl, filterId]
  )

  return { elRef, style, filterNode }
}
