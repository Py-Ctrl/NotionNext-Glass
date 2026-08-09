import { useEffect, useRef, useState, useId } from 'react'

let webglContextCount = 0
const MAX_WEBGL_CONTEXTS = 6

const LiquidGlassButton = ({
  label = '',
  btnStyle = 'surface',
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
    const wrapper = containerRef.current
    wrapper.innerHTML = ''

    const el = document.createElement('liquid-glass')
    el.style.cssText = `display:block;width:100%;height:100%;border-radius:inherit;overflow:hidden`
    wrapper.appendChild(el)

    // 设置壁纸和模式（按文档：先 append 再 setAttribute）
    el.setAttribute('wallpaper', 'gradient')
    if (dark) el.setAttribute('dark', '')
    el.setAttribute('mode', 'buttons')

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
        // 所有重试失败，切换到 CSS 回退
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
      if (wrapper.contains(el)) wrapper.removeChild(el)
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
          className='liquid-glass-btn-wrapper'
          style={{ width: '100%', height: '100%', borderRadius: 'inherit', overflow: 'hidden' }}
        />
      )}
    </div>
  )
}

export default LiquidGlassButton
