// @ts-nocheck
'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/router'
import { useLensBackdrop } from './useLensBackdrop'

/**
 * 滚动容器（对应原版 liquid-glass-webgl 的 scroll-container）：
 * 固定高度的玻璃卡片列表，卡片用 SVG 透镜实时折射页面背景，
 * 容器内部滚动时折射逐帧跟随更新。
 *
 * 外层面板刻意不加 backdrop-filter —— 带 backdrop-filter 的元素会成为
 * backdrop root，内部卡片的透镜就采样不到页面背景了。
 */
const ScrollCard = ({ item, index, onItemTap }) => {
  const router = useRouter()
  // 原版 Scroll Container 卡片参数：环带 16px / 位移 14 / 轻模糊 3 / 饱和 1.5
  const lens = useLensBackdrop({ refractionHeight: 16, maxMag: 14, blur: 3, saturate: 1.5 })

  const handleClick = () => {
    if (onItemTap) {
      onItemTap(item, index)
    } else if (item.href) {
      router.push(item.href)
    }
  }

  return (
    <button
      type='button'
      ref={lens.elRef}
      className='glass-scroll-card'
      style={lens.style || undefined}
      onClick={handleClick}>
      {lens.filterNode}
      <span className='glass-scroll-card-title'>{item.title}</span>
      {item.subtitle && (
        <span className='glass-scroll-card-subtitle'>{item.subtitle}</span>
      )}
      {item.linkText && (
        <span className='glass-scroll-card-link'>
          {item.linkText}
          <i className='fas fa-arrow-right' />
        </span>
      )}
    </button>
  )
}

const GlassScrollContainer = ({
  items = [],
  title,
  height = 360,
  className = '',
  onItemTap
}) => {
  const visible = useMemo(
    () => items.filter(item => item && item.title),
    [items]
  )
  if (visible.length === 0) return null

  const headH = title ? 44 : 14

  return (
    <div
      className={`glass-scroll-container ${className}`}
      style={{ height: typeof height === 'number' ? `${height}px` : height }}>
      {title && (
        <div className='glass-scroll-head'>
          <i className='fas fa-bolt' />
          {title}
        </div>
      )}
      <div
        className='glass-scroll-viewport'
        style={{ height: `calc(100% - ${headH}px)` }}>
        {visible.map((item, index) => (
          <ScrollCard key={item.key || index} item={item} index={index} onItemTap={onItemTap} />
        ))}
      </div>
    </div>
  )
}

export default GlassScrollContainer
