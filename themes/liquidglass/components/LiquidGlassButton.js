import { useEffect, useRef, useState, useId } from 'react'

let webglContextCount = 0
const MAX_WEBGL_CONTEXTS = 6

const LiquidGlassButton = ({
  label = '',
  btnStyle = 'transparent',
  onTap,
  width = '100%',
  height = '48px',
  className = '',
  fallbackClassName = '',
  dark = false
}) => {
  const containerRef = useRef(null)
  const [useWebGL, setUseWebGL] = useState(false)
  const [renderFailed, setRenderFailed] = useState(false)
  const btnIdRef = useRef(useId())

  useEffect(() => {
    if (webglContextCount >= MAX_WEBGL_CONTEXTS) return
    if (!window.__liquidGlassLoaded) {
      const handler = () => setUseWebGL(true)
      window.addEventListener('liquid-glass-ready', handler)
      const timer = setTimeout(() => {
        if (!window.__liquidGlassLoaded) setUseWebGL(false)
      }, 5000)
      return () => {
        window.removeEventListener('liquid-glass-ready', handler)
        clearTimeout(timer)
      }
    }
    setUseWebGL(true)
  }, [])

  useEffect(() => {
    if (!useWebGL || !containerRef.current) return

    webglContextCount++
    const frame = containerRef.current
    frame.innerHTML = ''

    // 按文档：先创建元素并设置 mode，再 append
    const el = document.createElement('liquid-glass')
    el.setAttribute('mode', 'buttons')
    el.setAttribute('wallpaper', 'gradient')
    if (dark) el.setAttribute('dark', '')
    el.style.cssText = 'width:100%;height:100%'
    frame.appendChild(el)

    // 带重试的 setButtons 调用
    let retries = 5
    let retryTimer = null
    let failed = false

    const trySetButtons = () => {
      if (failed) return
      if (typeof el.setButtons === 'function') {
        el.setButtons([{ id: btnIdRef.current, label, style: btnStyle }])
      } else if (retries > 0) {
        retries--
        retryTimer = setTimeout(trySetButtons, 100)
      } else {
        failed = true
        setRenderFailed(true)
      }
    }
    requestAnimationFrame(trySetButtons)

    const handleTap = (e) => {
      if (e.detail?.id === btnIdRef.current && onTap) {
        onTap(e.detail.id)
      }
    }
    document.addEventListener('lg-buttontap', handleTap)

    return () => {
      clearTimeout(retryTimer)
      document.removeEventListener('lg-buttontap', handleTap)
      webglContextCount = Math.max(0, webglContextCount - 1)
      if (frame.contains(el)) frame.removeChild(el)
    }
  }, [useWebGL, label, btnStyle, dark])

  const showFallback = !useWebGL || renderFailed

  return (
    <div
      className={className}
      style={{ width, height, position: 'relative' }}
    >
      {showFallback ? (
        <button
          onClick={onTap}
          className={`glass-btn w-full h-full flex items-center justify-center cursor-pointer ${fallbackClassName}`}
        >
          {label}
        </button>
      ) : (
        <div
          ref={containerRef}
          className='liquid-glass-btn-frame'
          style={{
            width: '100%',
            height: '100%',
            borderRadius: 'inherit',
            overflow: 'hidden',
            background: 'rgba(99, 102, 241, 0.1)'
          }}
        />
      )}
    </div>
  )
}

export default LiquidGlassButton
