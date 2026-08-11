// @ts-nocheck
'use client'

import * as React from 'react'
import { useGlobal } from '@/lib/global'
import { LiquidGlassCanvas } from '../lib/context'
import { makeButton } from '../lib/helpers'
import { getPalette } from '../lib/types'
import { getGradientWallpaper } from './liquidGlassWallpaper'

/**
 * 解析尺寸字符串为像素数字
 * 支持 '140px', '48px', 140, '100%' 等格式
 */
function parseSize (size, defaultValue = 48) {
  if (typeof size === 'number') return size
  if (typeof size === 'string') {
    const match = size.match(/^([\d.]+)(px)?$/)
    if (match) return parseFloat(match[1])
  }
  return defaultValue
}

/**
 * WebGL 液态玻璃按钮组件
 * 使用项目自带的 LiquidGlassRenderer 渲染真正的液态玻璃效果
 * 接口与 GlassButton 兼容，可直接替换
 */
const LiquidGlassButton = ({
  label = '',
  btnStyle = 'blue',
  onTap,
  width = '140px',
  height = '48px',
  className = '',
  fallbackClassName = '',
  id = ''
}) => {
  const { isDarkMode } = useGlobal()
  const containerRef = React.useRef(null)
  const [canvasW, setCanvasW] = React.useState(parseSize(width, 140))
  const [canvasH, setCanvasH] = React.useState(parseSize(height, 48))
  const [useWebGL, setUseWebGL] = React.useState(true)
  const buttonId = React.useMemo(() => id || `lg-btn-${Math.random().toString(36).slice(2, 9)}`, [id])

  // 检测 WebGL 支持
  React.useEffect(() => {
    try {
      const canvas = document.createElement('canvas')
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
      if (!gl) setUseWebGL(false)
    } catch (e) {
      setUseWebGL(false)
    }
  }, [])

  // 监听容器尺寸变化
  React.useEffect(() => {
    if (!containerRef.current) return
    const updateSize = () => {
      if (containerRef.current) {
        setCanvasW(containerRef.current.offsetWidth || parseSize(width, 140))
        setCanvasH(containerRef.current.offsetHeight || parseSize(height, 48))
      }
    }
    updateSize()
    const observer = new ResizeObserver(updateSize)
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [width, height])

  // 构建按钮元素配置
  const { elements, interactions } = React.useMemo(() => {
    if (!useWebGL || canvasW < 10 || canvasH < 10) {
      return { elements: [], interactions: {} }
    }

    const palette = getPalette(!isDarkMode)
    const w = canvasW
    const h = canvasH

    // 根据按钮样式选择颜色
    let tintColor, surfaceColor, labelColor
    if (btnStyle === 'blue') {
      if (isDarkMode) {
        // 暗色模式：靛蓝色半透明玻璃
        tintColor = [129 / 255, 140 / 255, 248 / 255, 0.35]
        surfaceColor = [129 / 255, 140 / 255, 248 / 255, 0.15]
        labelColor = [199 / 255, 210 / 255, 254 / 255, 1] // 浅靛蓝
      } else {
        // 亮色模式：靛蓝色半透明玻璃
        tintColor = [99 / 255, 102 / 255, 241 / 255, 0.35]
        surfaceColor = [99 / 255, 102 / 255, 241 / 255, 0.15]
        labelColor = [67 / 255, 56 / 255, 202 / 255, 1] // 深靛蓝
      }
    } else {
      // surface 样式：使用主题默认按钮表面色
      tintColor = [0, 0, 0, 0]
      surfaceColor = palette.buttonSurface
      labelColor = isDarkMode ? [1, 1, 1, 1] : [0, 0, 0, 1]
    }

    const btnEl = makeButton(
      buttonId,
      { x: 0, y: 0, w, h },
      {
        label,
        tintColor,
        surfaceColor,
        labelColor,
        labelFontSizePx: Math.min(15, h * 0.35)
      },
      false // scroll=false，按钮不随滚动移动
    )

    // 按钮使用独立背景，直接采样壁纸
    btnEl.independentBackdrop = true
    // 增强玻璃效果参数
    btnEl.refractionHeight = 12
    btnEl.refractionAmount = -24
    btnEl.blurRadius = 8
    btnEl.saturation = 1.5

    return {
      elements: [btnEl],
      interactions: {
        [buttonId]: {
          onTap: () => onTap?.()
        }
      }
    }
  }, [useWebGL, canvasW, canvasH, isDarkMode, btnStyle, label, buttonId, onTap])

  // WebGL 不可用时降级为 CSS 按钮
  if (!useWebGL) {
    const styleMap = {
      blue: 'liquid-glass-btn-blue',
      surface: 'liquid-glass-btn-surface',
      transparent: 'liquid-glass-btn-surface'
    }
    return (
      <button
        onClick={onTap}
        className={`liquid-glass-btn ${styleMap[btnStyle] || styleMap.transparent} ${fallbackClassName} ${className}`}
        style={{ width, height }}
      >
        {label}
      </button>
    )
  }

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        width,
        height,
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '16px',
        cursor: 'pointer'
      }}
    >
      <LiquidGlassCanvas
        wallpaperSrc={getGradientWallpaper(isDarkMode)}
        elements={elements}
        interactions={interactions}
        dpr={1.5}
        cornerStyle={1}
        className="w-full h-full"
      />
    </div>
  )
}

export default LiquidGlassButton
