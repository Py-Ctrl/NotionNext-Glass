// @ts-nocheck
'use client'

import * as React from 'react'
import { useGlobal } from '@/lib/global'
import { LiquidGlassCanvas } from '../lib/context'
import { makeGlassShape } from '../lib/helpers'
import { getGradientWallpaper } from './liquidGlassWallpaper'

/**
 * 液态玻璃滚动容器
 *
 * 用 WebGL 液态玻璃作为背景，HTML 内容在容器内滚动。
 * 参考 liquid-glass-webgl 项目的 Scroll Container 效果。
 *
 * Props:
 * - children: 滚动内容
 * - height: 容器高度，默认 '70vh'
 * - className: 额外类名
 * - borderRadius: 玻璃圆角，默认 24
 */
export default function LiquidGlassScrollContainer ({
  children,
  height = '70vh',
  className = '',
  borderRadius = 24
}) {
  const { isDarkMode } = useGlobal()
  const containerRef = React.useRef(null)
  const [containerW, setContainerW] = React.useState(0)
  const [containerH, setContainerH] = React.useState(0)
  const [useWebGL, setUseWebGL] = React.useState(true)
  const [scrollTop, setScrollTop] = React.useState(0)
  const [scrollHeight, setScrollHeight] = React.useState(0)
  const [clientHeight, setClientHeight] = React.useState(0)

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
        setContainerW(containerRef.current.offsetWidth || 0)
        setContainerH(containerRef.current.offsetHeight || 0)
      }
    }
    updateSize()
    const ro = new ResizeObserver(updateSize)
    ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [height])

  // 监听滚动内容尺寸变化
  const contentRef = React.useRef(null)
  React.useEffect(() => {
    if (!contentRef.current) return
    const updateScrollInfo = () => {
      if (contentRef.current) {
        setScrollHeight(contentRef.current.scrollHeight || 0)
        setClientHeight(contentRef.current.clientHeight || 0)
      }
    }
    updateScrollInfo()
    const ro = new ResizeObserver(updateScrollInfo)
    ro.observe(contentRef.current)
    return () => ro.disconnect()
  }, [])

  // 处理滚动事件，更新滚动位置（用于顶部/底部遮罩）
  const handleScroll = (e) => {
    setScrollTop(e.target.scrollTop || 0)
  }

  // 构建玻璃背景元素
  const glassElements = React.useMemo(() => {
    if (containerW <= 0 || containerH <= 0) return []
    return [
      makeGlassShape(
        'scroll-container-bg',
        { x: 0, y: 0, w: containerW, h: containerH },
        {
          cornerRadius: borderRadius,
          refractionHeight: 16,
          refractionAmount: -32,
          blurRadius: 4,
          saturation: 1.5,
          surfaceColor: isDarkMode
            ? [0.07, 0.07, 0.07, 0.4]
            : [0.98, 0.98, 0.98, 0.4],
          highlight: {
            alpha: 0.3,
            offsetY: -2,
            size: 0.5
          },
          outerShadow: {
            radius: 24,
            alpha: 0.15,
            offsetX: 0,
            offsetY: 8
          },
          chromaticAberration: true,
          independentBackdrop: false
        },
        false // 不随滚动移动
      )
    ]
  }, [containerW, containerH, borderRadius, isDarkMode])

  // WebGL 不可用时的降级样式
  if (!useWebGL) {
    return (
      <div
        ref={containerRef}
        className={`glass-card overflow-hidden ${className}`}
        style={{ height, borderRadius }}
      >
        <div
          ref={contentRef}
          className='h-full overflow-y-auto'
          onScroll={handleScroll}
        >
          {children}
        </div>
      </div>
    )
  }

  // 判断是否显示顶部/底部渐变遮罩
  const showTopMask = scrollTop > 5
  const showBottomMask = scrollTop + clientHeight < scrollHeight - 5

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      style={{ height, borderRadius }}
    >
      {/* WebGL 液态玻璃背景 */}
      <LiquidGlassCanvas
        wallpaperSrc={getGradientWallpaper(isDarkMode)}
        elements={glassElements}
        dpr={1.5}
        cornerStyle={1}
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius,
          overflow: 'hidden',
          pointerEvents: 'none'
        }}
      />

      {/* 滚动内容 */}
      <div
        ref={contentRef}
        className='absolute inset-0 overflow-y-auto'
        style={{
          pointerEvents: 'auto',
          WebkitOverflowScrolling: 'touch'
        }}
        onScroll={handleScroll}
      >
        {children}
      </div>

      {/* 顶部渐变遮罩 */}
      {showTopMask && (
        <div
          className='absolute top-0 left-0 right-0 h-8 pointer-events-none transition-opacity duration-200'
          style={{
            background: isDarkMode
              ? 'linear-gradient(to bottom, rgba(18,18,18,0.6), transparent)'
              : 'linear-gradient(to bottom, rgba(250,250,250,0.6), transparent)',
            opacity: showTopMask ? 1 : 0
          }}
        />
      )}

      {/* 底部渐变遮罩 */}
      {showBottomMask && (
        <div
          className='absolute bottom-0 left-0 right-0 h-8 pointer-events-none transition-opacity duration-200'
          style={{
            background: isDarkMode
              ? 'linear-gradient(to top, rgba(18,18,18,0.6), transparent)'
              : 'linear-gradient(to top, rgba(250,250,250,0.6), transparent)',
            opacity: showBottomMask ? 1 : 0
          }}
        />
      )}
    </div>
  )
}
