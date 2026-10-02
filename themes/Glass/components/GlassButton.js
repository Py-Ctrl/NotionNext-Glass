// @ts-nocheck
'use client'

/**
 * 玻璃按钮：纯 CSS 玻璃（blur + 边缘高光 + hover/按压动画），**不挂 SVG 透镜**。
 *
 * 为什么按钮不做折射：
 *   1. 按钮几乎总是嵌在带 backdrop-filter 的卡片里，祖先会成为 backdrop root，
 *      内层透镜采样不到页面背景 → 折射必然失效（style.js 里已记录该坑）；
 *   2. 挂着的 `url()` 还会把 CSS 的 `blur()` 顶掉 —— 等于白付一份滤镜成本、
 *      反而丢了模糊。
 * 参考 Apple 的做法：按钮这一级「模糊 + 边缘高光 + 动画」就够了，
 * 折射留给大卡片和底栏。接口与旧 LiquidGlassButton（WebGL 版）兼容，可直接替换。
 */
const GlassButton = ({
  label = '',
  btnStyle = 'transparent',
  onTap,
  width = '100%',
  height = '48px',
  className = '',
  fallbackClassName = ''
}) => {
  const styleMap = {
    blue: 'liquid-glass-btn-blue',
    surface: 'liquid-glass-btn-surface',
    transparent: 'liquid-glass-btn-surface'
  }

  return (
    <button
      onClick={onTap}
      className={`liquid-glass-btn ${styleMap[btnStyle] || styleMap.transparent} ${fallbackClassName} ${className}`}
      style={{ width, height }}>
      {label}
    </button>
  )
}

export default GlassButton
