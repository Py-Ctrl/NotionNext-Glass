/**
 * 首屏加载动画：液态玻璃涟漪
 *
 * 四阶段（时间点见 STAGES）：
 *   curtain 0     暗色玻璃幕布淡入，把页面压成暗底
 *   ball    420   一颗玻璃球在中心凝聚成形 —— 挂 feTurbulence + feDisplacementMap，
 *                 对幕布后的页面做逐像素液态位移（真折射，不是模糊）
 *   brand   1050  站点 Logo + 标题在玻璃球上浮现
 *   melt    1700  玻璃球带液态湍流放大消散，幕布褪去露出页面
 *
 * 一次会话只播一次（sessionStorage）；prefers-reduced-motion 直接跳过；
 * pointer-events: none 不拦交互；SSR 阶段就渲染，覆盖首屏白屏。
 */
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import LazyImage from '@/components/LazyImage'
import { useGlobal } from '@/lib/global'
import { siteConfig } from '@/lib/config'

const STAGES = [
  ['curtain', 0],
  ['ball', 420],
  ['brand', 1050],
  ['melt', 1700]
]
const GONE_AT = 2260 // 四阶段跑完再卸载
const SEEN_KEY = 'glass-splash-seen'
const FILTER_ID = 'glass-splash-liquid'

// SSR 阶段没有 window：useLayoutEffect 会告警，退回 useEffect
const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect

export default function LoadingSplash() {
  const [stage, setStage] = useState('curtain')
  const [gone, setGone] = useState(false)
  const timers = useRef([])
  const { siteInfo } = useGlobal()

  useIsoLayoutEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduce || sessionStorage.getItem(SEEN_KEY)) {
      setGone(true)
      return
    }
    sessionStorage.setItem(SEEN_KEY, '1')
    // 先清掉可能残留的旧定时器（StrictMode 双调用 / 热重载）
    timers.current.forEach(clearTimeout)
    timers.current = STAGES.map(([name, at]) => setTimeout(() => setStage(name), at))
    timers.current.push(setTimeout(() => setGone(true), GONE_AT))
    return () => {
      timers.current.forEach(clearTimeout)
      timers.current = []
    }
  }, [])

  if (gone) return null

  const title = siteInfo?.title || siteConfig('TITLE')
  const logo = siteInfo?.icon || siteConfig('AVATAR')

  return (
    <div className='glass-splash' data-stage={stage} aria-hidden='true'>
      {/* 液态折射滤镜：feTurbulence 生成分形噪声 → feDisplacementMap 用它逐像素位移。
          baseFrequency 用 SMIL 持续微动，玻璃始终"活着"而不是一块死板的白片 */}
      <svg className='glass-splash-defs' aria-hidden='true' width='0' height='0'>
        <filter
          id={FILTER_ID}
          x='-30%'
          y='-30%'
          width='160%'
          height='160%'
          colorInterpolationFilters='sRGB'>
          <feTurbulence
            type='fractalNoise'
            baseFrequency='0.009 0.013'
            numOctaves='3'
            seed='11'
            result='noise'>
            <animate
              attributeName='baseFrequency'
              dur='7s'
              repeatCount='indefinite'
              values='0.009 0.013; 0.017 0.007; 0.009 0.013'
            />
          </feTurbulence>
          <feDisplacementMap
            in='SourceGraphic'
            in2='noise'
            scale='46'
            xChannelSelector='R'
            yChannelSelector='G'
          />
        </filter>
      </svg>

      {/* 1 暗色玻璃幕布 */}
      <div className='glass-splash-curtain' />

      {/* 2 玻璃球 */}
      <div className='glass-splash-ball'>
        <span className='glass-splash-sheen' />
      </div>

      {/* 3 站点标题 / Logo */}
      <div className='glass-splash-brand'>
        {logo ? (
          <LazyImage
            className='glass-splash-logo'
            src={logo}
            width={64}
            height={64}
            alt={siteConfig('AUTHOR') || title}
          />
        ) : null}
        {title ? <span className='glass-splash-title'>{title}</span> : null}
      </div>
    </div>
  )
}
