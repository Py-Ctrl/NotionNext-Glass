import { useEffect, useRef, useState } from 'react'
import { useGlobal } from '@/lib/global'

const JumpToTopButton = ({ percent }) => {
  const { isDarkMode } = useGlobal()
  const containerRef = useRef(null)
  const [useWebGL, setUseWebGL] = useState(false)
  const percentRef = useRef(percent)

  useEffect(() => {
    percentRef.current = percent
  }, [percent])

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
    el.setAttribute('mode', 'ring-progress')
    if (isDarkMode) el.setAttribute('dark', '')
    el.style.cssText = 'width:100%;height:100%'
    container.appendChild(el)

    let retries = 5
    let retryTimer = null

    const trySetProgress = () => {
      if (typeof el.setState === 'function') {
        el.setState({ ringProgressValue: percentRef.current })
      } else if (retries > 0) {
        retries--
        retryTimer = setTimeout(trySetProgress, 100)
      }
    }
    requestAnimationFrame(trySetProgress)

    const handleClick = () => {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
    container.addEventListener('click', handleClick)

    return () => {
      clearTimeout(retryTimer)
      container.removeEventListener('click', handleClick)
      if (container.contains(el)) container.removeChild(el)
    }
  }, [useWebGL, isDarkMode])

  useEffect(() => {
    if (!useWebGL || !containerRef.current) return
    const el = containerRef.current.querySelector('liquid-glass')
    if (el && typeof el.setState === 'function') {
      el.setState({ ringProgressValue: percent })
    }
  }, [percent, useWebGL])

  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (!useWebGL) {
    return (
      <div
        onClick={handleScrollToTop}
        className='glass-float-btn relative cursor-pointer'
        title='回到顶部'>
        <svg className='w-5 h-5' viewBox='0 0 24 24' fill='none'>
          <circle
            cx='12'
            cy='12'
            r='10'
            stroke='currentColor'
            strokeWidth='2'
            className='text-gray-300 dark:text-gray-600'
          />
          <circle
            cx='12'
            cy='12'
            r='10'
            stroke='#6366f1'
            strokeWidth='2'
            strokeLinecap='round'
            strokeDasharray={`${(percent || 0) * 0.628} 62.8`}
            transform='rotate(-90 12 12)'
            fill='none'
          />
          <path
            d='M8 14l4-4 4 4'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
            fill='none'
            className='text-gray-600 dark:text-gray-400'
          />
        </svg>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className='rounded-full overflow-hidden cursor-pointer'
      style={{ width: '56px', height: '56px', background: isDarkMode ? '#000' : '#fff' }}
      title='回到顶部'
    />
  )
}

export default JumpToTopButton
