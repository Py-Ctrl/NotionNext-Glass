// @ts-nocheck
'use client'

/**
 * 玻璃按钮：纯 CSS 玻璃（blur + 边缘高光 + hover/按压动画），不挂 SVG 透镜。
 * 按钮嵌在带 backdrop-filter 的卡片里，祖先会成为 backdrop root → 内层折射必然失效，
 * 且挂着的 url() 会把 CSS blur() 顶掉。接口与旧 LiquidGlassButton（WebGL 版）兼容。
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
