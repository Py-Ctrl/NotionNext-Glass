/**
 * 引入 Liquid Glass WebGL 组件脚本
 * 仅在浏览器端加载
 */
import { useEffect } from 'react'
import { siteConfig } from '@/lib/config'
import CONFIG from '../config'

const LiquidGlassScript = () => {
  useEffect(() => {
    if (!siteConfig('LIQUID_GLASS_WEBGL_ENABLED', null, CONFIG)) return
    if (document.querySelector('script[data-liquid-glass]')) return

    const script = document.createElement('script')
    script.src = 'https://glass.goose.cc.cd/liquid-glass.js'
    script.setAttribute('data-liquid-glass', '')
    script.async = true
    document.head.appendChild(script)

    return () => {
      // 不移除以避免重复加载
    }
  }, [])

  return null
}

export default LiquidGlassScript