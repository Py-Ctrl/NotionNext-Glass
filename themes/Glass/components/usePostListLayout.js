// @ts-nocheck
'use client'

import { useCallback, useEffect, useState } from 'react'
import CONFIG from '../config'
import { siteConfig } from '@/lib/config'

const STORAGE_KEY = 'glass-post-layout'

/**
 * 文章列表排列方式（'list' 纵向 | 'hover' 网格悬停展开），
 * localStorage 持久化 + 自定义事件跨组件同步。
 */
export function usePostListLayout() {
  const [layout, setLayout] = useState(() =>
    siteConfig('POST_LIST_LAYOUT', 'list', CONFIG) === 'hover' ? 'hover' : 'list'
  )

  useEffect(() => {
    if (typeof window === 'undefined') return
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'hover' || saved === 'list') setLayout(saved)
    const onChange = e => setLayout(e.detail)
    window.addEventListener('glass-post-layout-change', onChange)
    return () => window.removeEventListener('glass-post-layout-change', onChange)
  }, [])

  const changeLayout = useCallback(next => {
    if (next !== 'hover' && next !== 'list') return
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch (e) {}
    setLayout(next)
    window.dispatchEvent(new CustomEvent('glass-post-layout-change', { detail: next }))
  }, [])

  return { layout, changeLayout }
}
