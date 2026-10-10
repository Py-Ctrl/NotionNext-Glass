/**
 * Firefox 可用的「背景折射玻璃」
 *
 * ## 为什么需要它
 * 主题现有的透镜走 `backdrop-filter: url(#f)`，这是 **Chromium 专属** ——
 * Firefox 不支持 `backdrop-filter` 的 `url()` 形式，折射完全失效。
 *
 * ## 思路：把壁纸复制进 SVG 再滤镜
 * `backdrop-filter` 的本质是「采样元素背后的画面并处理」。Firefox 没有这条路，
 * 但本主题的玻璃折射对象**就是全站壁纸**，所以可以直接把壁纸**复制一份**进 SVG，
 * 对这份副本施加 `feDisplacementMap`，再裁到元素形状 —— 视觉上等价。
 *
 * 三个必须做对的点：
 *  1. **cover 几何要复刻**：壁纸是 `center / cover no-repeat` + `background-attachment: fixed`，
 *     即按视口等比放大到铺满、居中。SVG 里要用同样的算法算 <image> 的位置和尺寸，
 *     否则折射出来的壁纸和真实壁纸对不上，边缘会露馅。
 *  2. **滤镜定义在 SVG 内部，用 SVG `filter` 表现属性引用**（不用 CSS `filter: url()`）。
 *  3. **滤镜区域要外扩**：折射会把像素推出去，区域卡紧会被裁。
 *
 * ## 其它 Firefox 注意点
 * - `colorInterpolationFilters="sRGB"`：滤镜默认 linearRGB，而位移图按 sRGB 编码。
 *   JSX 里写 camelCase（React 会渲染成 `color-interpolation-filters`）。
 * - Firefox 会**忽略 `feImage` 的 `preserveAspectRatio="none"`**，强制等比缩放 ——
 *   所以位移图按元素实际尺寸生成，保证长宽比一致，绕开这个限制。
 * - Firefox **不支持 `feImage` 引用 SVG 内部元素**，位移图必须用 data URI。
 *
 * ## 限制
 * - 只折射**壁纸**，不折射壁纸上方的其它 DOM 内容（这是该手法的固有代价）。
 * - 位移图会把内容栅格化，适合装饰性容器，不适合放可选中文本。
 */
import { useEffect, useId, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { generateRoundedRectLensMap } from './capsuleLensMap'

const REFRACTION_HEIGHT = 26
const MAX_MAG = 18

export interface SvgBackdropLensProps {
  /** 元素宽高（px） */
  width: number
  height: number
  radius?: number
  className?: string
  style?: CSSProperties
  /** 壁纸地址；不传则自动读 #theme-glass 上的 --glass-bg-image */
  imageUrl?: string | null
  /** 蒙版浓度（0~1），对应 --glass-veil */
  veil?: number
  /** 玻璃底色叠加，默认取主题的 --glass-bg */
  tint?: string
  /** 模糊半径（px），对应主题的 --glass-blur；不传则自动读 CSS 变量，默认 16 */
  blurRadius?: number
}

/** 把 CSS `center / cover` 的几何算出来 */
function coverGeometry (iw: number, ih: number, vw: number, vh: number) {
  if (!iw || !ih) return { dw: vw, dh: vh, dx: 0, dy: 0 }
  const scale = Math.max(vw / iw, vh / ih)
  const dw = iw * scale
  const dh = ih * scale
  return { dw, dh, dx: (vw - dw) / 2, dy: (vh - dh) / 2 }
}

export default function SvgBackdropLens ({
  width,
  height,
  radius = 24,
  className,
  style,
  imageUrl,
  veil,
  tint,
  blurRadius
}: SvgBackdropLensProps) {
  const uid = useId()
  const filterId = `svg-backdrop-lens-${uid.replace(/:/g, '')}`
  const hostRef = useRef<SVGSVGElement | null>(null)
  const [mapUrl, setMapUrl] = useState<string | null>(null)
  const [geom, setGeom] = useState<{ dw: number, dh: number, dx: number, dy: number } | null>(null)
  const [src, setSrc] = useState<string | null>(imageUrl ?? null)
  const [veilValue, setVeilValue] = useState<number>(veil ?? 0.2)
  const [blurValue, setBlurValue] = useState<number>(blurRadius ?? 16)

  // 壁纸与蒙版：优先用 props，否则读主题注入的 CSS 变量
  useEffect(() => {
    if (imageUrl !== undefined || typeof window === 'undefined') return
    const root = document.getElementById('theme-glass')
    if (!root) return
    const cs = getComputedStyle(root)
    const raw = cs.getPropertyValue('--glass-bg-image').trim()
    const m = raw.match(/url\(["']?(.*?)["']?\)/)
    if (m) setSrc(m[1])
    if (veil === undefined) {
      const v = parseFloat(cs.getPropertyValue('--glass-veil'))
      if (!Number.isNaN(v)) setVeilValue(v)
    }
    if (blurRadius === undefined) {
      const bl = parseFloat(cs.getPropertyValue('--glass-blur'))
      if (!Number.isNaN(bl)) setBlurValue(bl)
    }
  }, [imageUrl, veil, blurRadius])

  // 位移图按元素实际尺寸生成 —— 与壁纸副本同尺寸，长宽比一致，
  // 从而绕开 Firefox 对 feImage 强制等比缩放的限制
  useEffect(() => {
    if (!width || !height) return
    setMapUrl(generateRoundedRectLensMap(width, height, radius, REFRACTION_HEIGHT, MAX_MAG))
  }, [width, height, radius])

  // 加载壁纸拿原始尺寸，再算 cover 几何；元素位置变化时重算
  useEffect(() => {
    if (!src || typeof window === 'undefined') return
    let cancelled = false
    const img = new window.Image()
    img.onload = () => {
      if (cancelled) return
      const compute = () => {
        const host = hostRef.current
        if (!host) return
        const r = host.getBoundingClientRect()
        const vw = window.innerWidth
        const vh = window.innerHeight
        const { dw, dh, dx, dy } = coverGeometry(img.naturalWidth, img.naturalHeight, vw, vh)
        // SVG 内部坐标 = 视口坐标 - 元素在视口中的位置
        setGeom({ dw, dh, dx: dx - r.left, dy: dy - r.top })
      }
      compute()
      const onScroll = () => requestAnimationFrame(compute)
      window.addEventListener('scroll', onScroll, { passive: true })
      window.addEventListener('resize', onScroll, { passive: true })
      return () => {
        window.removeEventListener('scroll', onScroll)
        window.removeEventListener('resize', onScroll)
      }
    }
    img.src = src
    return () => { cancelled = true }
  }, [src, width, height])

  if (!width || !height) return null

  const pad = MAX_MAG
  const resolvedTint = tint || 'var(--glass-bg)'
  // 原生路径是 backdrop-filter: blur(var(--glass-blur))，CSS 的 blur(r) 等价于
  // 高斯 stdDeviation = r/2。模糊是玻璃观感的一大半，缺了它副本会偏暗偏"实"。
  const blurStd = blurValue / 2

  return (
    <svg
      ref={hostRef}
      aria-hidden='true'
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      style={style}>
      <defs>
        {/* 滤镜定义在 SVG 内部；通过 <g filter="url(#id)"> 引用，不用 CSS filter: url() */}
        <filter
          id={filterId}
          filterUnits='userSpaceOnUse'
          x={-pad}
          y={-pad}
          width={width + pad * 2}
          height={height + pad * 2}
          colorInterpolationFilters='sRGB'>
          {mapUrl && (
            <feImage
              href={mapUrl}
              x={0}
              y={0}
              width={width}
              height={height}
              preserveAspectRatio='none'
              result='lensMap'
            />
          )}
          <feGaussianBlur in='SourceGraphic' stdDeviation={blurStd} result='blurred' />
          <feDisplacementMap
            in='blurred'
            in2='lensMap'
            scale={MAX_MAG * 2}
            xChannelSelector='R'
            yChannelSelector='G'
          />
        </filter>
        <clipPath id={`${filterId}-clip`}>
          <rect x={0} y={0} width={width} height={height} rx={radius} ry={radius} />
        </clipPath>
      </defs>

      <g clipPath={`url(#${filterId}-clip)`}>
        {/* 被折射的壁纸副本 */}
        <g filter={`url(#${filterId})`}>
          {geom && src && (
            <image
              href={src}
              x={geom.dx}
              y={geom.dy}
              width={geom.dw}
              height={geom.dh}
              preserveAspectRatio='none'
            />
          )}
          {/* 兜底底色：壁纸没加载出来时至少是玻璃而不是透明 */}
          <rect x={0} y={0} width={width} height={height} fill={resolvedTint} />
        </g>
        {/* 蒙版：压住壁纸对比度，保证上面文字可读（不参与折射） */}
        <rect
          x={0}
          y={0}
          width={width}
          height={height}
          fill={`rgba(255,255,255,${veilValue})`}
        />
      </g>
    </svg>
  )
}
