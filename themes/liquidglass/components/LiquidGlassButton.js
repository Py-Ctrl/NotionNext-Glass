import { useEffect, useRef, useState, useId } from 'react'
import { useGlobal } from '@/lib/global'
import { getWallpaper } from './liquidGlassWallpaper'

let webglContextCount = 0
const MAX_WEBGL_CONTEXTS = 6

const LiquidGlassButton = ({
  label = '',
  btnStyle = 'transparent',
  onTap,
  width = '100%',
  height = '48px',
  className = '',
  fallbackClassName = ''
}) => {
  const { isDarkMode } = useGlobal()
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
    const container = containerRef.current
    container.innerHTML = ''

    const el = document.createElement('liquid-glass')
    el.setAttribute('mode', 'buttons')
    el.setAttribute('wallpaper', getWallpaper(isDarkMode))
    if (isDarkMode) el.setAttribute('dark', '')
    el.style.cssText = 'width:100%;height:100%'
    container.appendChild(el)

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
      if (container.contains(el)) container.removeChild(el)
    }
  }, [useWebGL, label, btnStyle, isDarkMode])

  const showFallback = !useWebGL || renderFailed

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ width, height, position: 'relative', borderRadius: 'inherit', overflow: 'hidden' }}
    >
      {showFallback && (
        <button
          onClick={onTap}
          className={`glass-btn w-full h-full flex items-center justify-center cursor-pointer ${fallbackClassName}`}
        >
          {label}
        </button>
      )}
    </div>
  )
}

export default LiquidGlassButton
