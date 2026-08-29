// @ts-nocheck
'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { generateRoundedRectLensMap } from './capsuleLensMap'

let uidCounter = 0

/**
 * 给任意玻璃卡片挂 SVG 透镜折射（backdrop-filter: url(#feDisplacementMap)），
 * 对应原版 liquid-glass-webgl Scroll Container 的卡片效果
 * （refractionHeight 16dp / refractionAmount -32dp / 无模糊 / 饱和 1.5）。
 *
 * - 圆角自动读取元素 computed border-radius（响应式断点切换半径也能跟随）
 * - ResizeObserver 跟随尺寸变化重建位移图
 * - feImage 的 data URL 异步加载后 Chromium 不重跑 backdrop-filter，
 *   每次换图后强制重绘（关-开 backdrop-filter）
 * - 仅 Chromium 支持 url() 引用；Safari/Firefox / 触屏设备返回 null，
 *   调用方保留原有 CSS 模糊回退
 */
export function useLensBackdrop({
  refractionHeight = 16,
  maxMag = 14,
  blur = 3,
  saturate = 1.5,
} = {}) {
  const elRef = useRef(null)
  const [supported] = useState(() => {
    if (typeof window === 'undefined' || typeof CSS === 'undefined' || !CSS.supports) return false
    // 触屏设备不启用：滚动时逐帧重跑位移滤镜的开销过大
    if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) return false
    try {
      return CSS.supports('backdrop-filter', 'url(#lens-card-probe)')
    } catch (e) {
      return false
    }
  })
  const [size, setSize] = useState(null)
  const [radius, setRadius] = useState(16)
  const [filterId] = useState(() => `lens-card-${++uidCounter}`)

  useEffect(() => {
    if (!supported || !elRef.current) return
    const el = elRef.current
    const update = () => {
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
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [supported])

  const mapUrl = useMemo(() => {
    if (!supported || !size) return ''
    return generateRoundedRectLensMap(size.w, size.h, radius, refractionHeight, maxMag)
  }, [supported, size, radius, refractionHeight, maxMag])

  // 强制重绘：feImage 的 data URL 加载完成后 Chromium 不会自动重跑
  // backdrop-filter，必须等图加载完再关-开切换（过早切换位移不生效）
  useEffect(() => {
    if (!mapUrl || !elRef.current) return
    const el = elRef.current
    const url = `url(#${filterId})`
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
    img.src = mapUrl
    return () => {
      cancelled = true
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [mapUrl, filterId])

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
    () => (mapUrl ? { backdropFilter: `url(#${filterId})` } : null),
    [mapUrl, filterId]
  )

  return { elRef, style, filterNode }
}
