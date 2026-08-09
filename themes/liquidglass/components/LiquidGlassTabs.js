import { useEffect, useRef, useState, useId } from 'react'

const LiquidGlassTabs = ({
  tabs = [],
  onSelect,
  width = '100%',
  height = '120px',
  dark = false,
  className = ''
}) => {
  const containerRef = useRef(null)
  const [useWebGL, setUseWebGL] = useState(false)
  const tabsIdRef = useRef(useId())
  const onSelectRef = useRef(onSelect)
  const [activeIndex, setActiveIndex] = useState(-1)

  useEffect(() => {
    onSelectRef.current = onSelect
  }, [onSelect])

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

    const wrapper = containerRef.current
    wrapper.innerHTML = ''

    const el = document.createElement('liquid-glass')
    el.style.cssText = `display:block;width:100%;height:100%;border-radius:inherit;overflow:hidden`
    wrapper.appendChild(el)

    if (dark) el.setAttribute('dark', '')

    requestAnimationFrame(() => {
      el.setAttribute('mode', 'single-bottom-tabs')
      requestAnimationFrame(() => {
        const tabConfig = tabs.map(t => ({
          icon: t.icon || '',
          label: t.label || '',
          viewport: t.viewport || 24
        }))
        el.setTabs?.([tabConfig])
      })
    })

    const handleStateChange = (e) => {
      const idx = e.detail?.selectedTab
      if (typeof idx === 'number' && idx >= 0) {
        setActiveIndex(idx)
        onSelectRef.current?.(idx, tabs[idx])
      }
    }
    document.addEventListener('lg-statechange', handleStateChange)

    return () => {
      document.removeEventListener('lg-statechange', handleStateChange)
      if (wrapper.contains(el)) wrapper.removeChild(el)
    }
  }, [useWebGL, tabs])

  if (!useWebGL) {
    return (
      <div className={`flex gap-2 ${className}`} style={{ width }}>
        {tabs.map((tab, idx) => (
          <button
            key={idx}
            onClick={() => {
              setActiveIndex(idx)
              onSelect?.(idx, tab)
            }}
            className={`glass-btn flex-1 py-2.5 px-3 text-sm rounded-xl transition-all ${
              activeIndex === idx
                ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border-indigo-300'
                : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    )
  }

  return (
    <div
      className={className}
      style={{ width, height, position: 'relative' }}
    >
      <div
        ref={containerRef}
        style={{ width: '100%', height: '100%', borderRadius: 'inherit', overflow: 'hidden' }}
      />
    </div>
  )
}

export default LiquidGlassTabs
