import { useEffect, useRef, useState, useId } from 'react'
import { useGlobal } from '@/lib/global'
import { getWallpaper } from './liquidGlassWallpaper'

const LiquidGlassButtonGroup = ({
  buttons = [],
  onTap,
  width = '100%',
  className = '',
  fallbackClassName = ''
}) => {
  const { isDarkMode } = useGlobal()
  const containerRef = useRef(null)
  const [useWebGL, setUseWebGL] = useState(false)
  const [renderFailed, setRenderFailed] = useState(false)
  const groupIdRef = useRef(useId())
  const onTapRef = useRef(onTap)

  useEffect(() => {
    onTapRef.current = onTap
  }, [onTap])

  useEffect(() => {
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
        el.setButtons(buttons.map(b => ({
          id: b.id || b.label,
          label: b.label,
          style: b.style || 'transparent'
        })))
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
      if (e.detail?.id) {
        onTapRef.current?.(e.detail.id)
      }
    }
    document.addEventListener('lg-buttontap', handleTap)

    return () => {
      clearTimeout(retryTimer)
      document.removeEventListener('lg-buttontap', handleTap)
      if (container.contains(el)) container.removeChild(el)
    }
  }, [useWebGL, buttons, isDarkMode])

  const showFallback = !useWebGL || renderFailed
  const containerHeight = `${buttons.length * 80}px`

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ width, height: containerHeight, position: 'relative', borderRadius: 'inherit', overflow: 'hidden', background: isDarkMode ? '#000' : '#fff' }}
    >
      {showFallback && (
        <div className='flex flex-col gap-2 p-2'>
          {buttons.map((b, idx) => (
            <button
              key={idx}
              onClick={() => onTapRef.current?.(b.id || b.label)}
              className={`glass-btn w-full py-3 text-sm rounded-xl ${fallbackClassName}`}
            >
              {b.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default LiquidGlassButtonGroup
