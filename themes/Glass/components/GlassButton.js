// @ts-nocheck
'use client'

import { useLensBackdrop } from './useLensBackdrop'

/**
 * 玻璃按钮：CSS 玻璃 + SVG 透镜折射（backdrop-filter: url()），
 * 采样真实页面背景，零 WebGL 开销。触屏 / 不支持的浏览器自动退回纯 CSS。
 * 接口与旧 LiquidGlassButton（WebGL 版）兼容，可直接替换。
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
  const lens = useLensBackdrop({ refractionHeight: 12, maxMag: 12, blur: 0, saturate: 1.3 })
  const styleMap = {
    blue: 'liquid-glass-btn-blue',
    surface: 'liquid-glass-btn-surface',
    transparent: 'liquid-glass-btn-surface'
  }

  return (
    <button
      ref={lens.elRef}
      onClick={onTap}
      className={`liquid-glass-btn ${styleMap[btnStyle] || styleMap.transparent} ${fallbackClassName} ${className}`}
      style={{ width, height, ...(lens.style || {}) }}
    >
      {lens.filterNode}
      {label}
    </button>
  )
}

export default GlassButton
