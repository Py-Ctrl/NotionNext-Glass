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

    if (dark) el.setAttribute('dark', '')

    requestAnimationFrame(() => {
      el.setAttribute('mode', 'buttons')
      requestAnimationFrame(() => {
        el.setButtons?.([{ id: btnIdRef.current, label, style: btnStyle }])
      })
    })

    const handleTap = (e) => {
      if (e.detail?.id === btnIdRef.current && onTap) {
        onTap(e.detail.id)
      }
    }
    document.addEventListener('lg-buttontap', handleTap)

    return () => {
      document.removeEventListener('lg-buttontap', handleTap)
      webglContextCount = Math.max(0, webglContextCount - 1)
      if (wrapper.contains(el)) wrapper.removeChild(el)
    }
  }, [useWebGL, label, btnStyle, dark])

  return (
    <div
      className={className}
      style={{ width, height, position: 'relative' }}
    >
      {useWebGL ? (
        <div
          ref={containerRef}
          className='liquid-glass-btn-wrapper'
          style={{ width: '100%', height: '100%', borderRadius: 'inherit', overflow: 'hidden' }}
        />
      ) : (
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
