/**
 * 液态玻璃加载动画（首屏一次性）
 *
 * 三个阶段：
 *   A 汇聚 0–520ms    六滴玻璃从四周向中心汇聚，靠 goo 滤镜（blur + contrast）融成一团
 *   B 成镜 520–900ms  融合体淡出，同一位置浮现一块胶囊透镜 —— 挂主题的位移图滤镜，
 *                     真的折射出页面内容（不是模糊）
 *   C 展开 900–1250ms 透镜横向放大并淡出，露出页面
 *
 * 只在一次会话的首屏播放（sessionStorage 标记）；prefers-reduced-motion 直接跳过。
 * 纯展示层：pointer-events: none，不拦任何交互。
 */
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { generateCapsuleLensMap } from './capsuleLensMap'

const DURATION = 1400 // 总时长（ms）
const LENS_W = 420 // 透镜尺寸（位移图按这个尺寸生成，动画只改 transform）
const LENS_H = 88
const FILTER_ID = 'glass-splash-lens'
const SEEN_KEY = 'glass-splash-seen'

// SSR 阶段没有 window：useLayoutEffect 会告警，退回 useEffect
const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect

export default function LoadingSplash() {
  const [phase, setPhase] = useState('goo') // goo → lens → out → 卸载
  const [gone, setGone] = useState(false)
  const [lensMap, setLensMap] = useState(null)
  const timers = useRef([])

  useIsoLayoutEffect(() => {
    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduce || sessionStorage.getItem(SEEN_KEY)) {
      setGone(true)
      return
    }
    sessionStorage.setItem(SEEN_KEY, '1')
    // 位移图要用 canvas 生成，只能客户端做
    setLensMap(generateCapsuleLensMap(LENS_W, LENS_H, 18, 14, 0, 0.5))
    timers.current = [
      setTimeout(() => setPhase('lens'), 640),
      setTimeout(() => setPhase('out'), 1000),
      setTimeout(() => setGone(true), DURATION + 300)
    ]
    return () => timers.current.forEach(clearTimeout)
  }, [])

  if (gone) return null

  return (
    <div className='glass-splash' data-phase={phase} aria-hidden='true'>
      {/* 汇聚用的 goo 滤镜：feGaussianBlur 模糊 → feColorMatrix 把 alpha 阈值化，
          模糊开的两滴只要重叠就会被"焊"成一团。
          不能用 CSS 的 blur()+contrast()：CSS contrast 只作用于 RGB，不动 alpha，
          透明背景下水滴不会融合 */}
      <svg aria-hidden='true' width='0' height='0' style={{ position: 'absolute' }}>
        <filter id='glass-splash-goo' colorInterpolationFilters='sRGB'>
          <feGaussianBlur in='SourceGraphic' stdDeviation={9} result='b' />
          <feColorMatrix
            in='b'
            mode='matrix'
            values='1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -11'
          />
        </filter>
      </svg>

      {/* 透镜的位移图滤镜：feImage 铺满 + feDisplacementMap 逐像素位移 + 轻微模糊/饱和 */}
      {lensMap && (
        <svg aria-hidden='true' width='0' height='0' style={{ position: 'absolute' }}>
          <filter id={FILTER_ID} colorInterpolationFilters='sRGB'>
            <feImage
              href={lensMap}
              x={0}
              y={0}
              width={LENS_W}
              height={LENS_H}
              result='map'
              preserveAspectRatio='none'
            />
            <feDisplacementMap
              in='SourceGraphic'
              in2='map'
              scale={14 * 2}
              xChannelSelector='R'
              yChannelSelector='G'
            />
            <feGaussianBlur stdDeviation={0.8} />
            <feColorMatrix type='saturate' values={1.25} />
          </filter>
        </svg>
      )}

      {/* 汇聚：blur + contrast 做 goo，六滴融成一团 */}
      <div className='glass-splash-goo'>
        {[0, 1, 2, 3, 4, 5].map(i => (
          <span key={i} className={`glass-drop d${i}`} />
        ))}
      </div>

      {/* 成镜：同一位置的胶囊透镜，真折射 */}
      <div
        className='glass-splash-lens'
        style={{ width: LENS_W, height: LENS_H, borderRadius: LENS_H / 2 }}
      />
    </div>
  )
}
