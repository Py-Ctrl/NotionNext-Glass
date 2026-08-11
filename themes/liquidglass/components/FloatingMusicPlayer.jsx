import { useState, useEffect } from 'react'
import { siteConfig } from '@/lib/config'
import MusicPlayer from './MusicPlayer'

/**
 * 全局悬浮音乐播放器
 * - 紧凑模式：显示封面 + 播放/暂停 + 下一首
 * - 展开模式：显示完整播放器
 * - 固定在右下角，移动端适配
 */
const FloatingMusicPlayer = () => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const musicPlayerEnabled = siteConfig('MUSIC_PLAYER')

  useEffect(() => {
    if (musicPlayerEnabled) {
      // 延迟显示，避免页面加载时闪烁
      const timer = setTimeout(() => setIsVisible(true), 1000)
      return () => clearTimeout(timer)
    }
  }, [musicPlayerEnabled])

  if (!musicPlayerEnabled) return null

  return (
    <div
      className={`fixed z-40 transition-all duration-300 ease-out ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
      }`}
      style={{
        right: '16px',
        bottom: '80px', // 在底部标签栏上方
        maxWidth: 'calc(100vw - 32px)'
      }}
    >
      {/* 展开模式：完整播放器 */}
      {isExpanded && (
        <div className='glass-card p-4 w-72 sm:w-80 mb-2 shadow-2xl'>
          <div className='flex justify-between items-center mb-3'>
            <span className='text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
              正在播放
            </span>
            <button
              onClick={() => setIsExpanded(false)}
              className='w-6 h-6 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors'
              title='收起'
            >
              <svg className='w-3.5 h-3.5' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.5' strokeLinecap='round'>
                <path d='M18 15l-6-6-6 6' />
              </svg>
            </button>
          </div>
          <MusicPlayer />
        </div>
      )}

      {/* 紧凑模式：迷你播放器 */}
      <div
        className={`glass-card rounded-2xl shadow-xl cursor-pointer transition-all hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] ${
          isExpanded ? 'hidden' : 'block'
        }`}
        onClick={() => setIsExpanded(true)}
      >
        <MusicPlayer compact={true} />
      </div>
    </div>
  )
}

export default FloatingMusicPlayer
