import { useEffect } from 'react'
import { siteConfig } from '@/lib/config'
import CONFIG from '../config'

const LiquidGlassScript = () => {
  useEffect(() => {
    if (!siteConfig('LIQUID_GLASS_WEBGL_ENABLED', null, CONFIG)) return
    if (document.querySelector('script[data-liquid-glass]')) {
      if (window.__liquidGlassLoaded) return
    }

    const script = document.createElement('script')
    script.src = 'https://glass.goose.cc.cd/liquid-glass.js'
    script.setAttribute('data-liquid-glass', '')
    document.head.appendChild(script)

    script.onload = () => {
      window.__liquidGlassLoaded = true
      window.dispatchEvent(new CustomEvent('liquid-glass-ready'))
    }

    script.onerror = () => {
      console.warn('[LiquidGlass] CDN script failed to load')
      window.__liquidGlassLoaded = false
    }
  }, [])

  return null
}

export default LiquidGlassScript