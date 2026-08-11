import { useRef, useState, useEffect, useCallback } from 'react'
import { siteConfig } from '@/lib/config'
import MusicPlayer from './MusicPlayer'

/**
 * 全局悬浮音乐播放器
 * - 折叠模式：迷你播放器（封面 + 播放/暂停 + 下一首）
 * - 展开模式：完整播放器
 * - 支持窗口拖拽
 * - 单例音频实例，避免双重播放
 */
const FloatingMusicPlayer = () => {
  const audioList = siteConfig('MUSIC_PLAYER_AUDIO_LIST')
  const order = siteConfig('MUSIC_PLAYER_ORDER')
  const musicPlayerEnabled = siteConfig('MUSIC_PLAYER')

  // 音频引用和状态
  const audioRef = useRef(null)
  const [currentIdx, setCurrentIdx] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [volume, setVolume] = useState(0.7)
  const [showPlaylist, setShowPlaylist] = useState(false)
  const [isDraggingProgress, setIsDraggingProgress] = useState(false)
  const [dragProgress, setDragProgress] = useState(0)

  // UI 状态
  const [isExpanded, setIsExpanded] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  // 窗口拖拽状态
  const [position, setPosition] = useState({ left: null, top: null, right: 16, bottom: 80 })
  const [isDraggingWindow, setIsDraggingWindow] = useState(false)
  const dragOffset = useRef({ x: 0, y: 0 })
  const playerRef = useRef(null)

  const currentTrack = audioList?.[currentIdx]

  // 延迟显示
  useEffect(() => {
    if (musicPlayerEnabled) {
      const timer = setTimeout(() => setIsVisible(true), 800)
      return () => clearTimeout(timer)
    }
  }, [musicPlayerEnabled])

  // 暂停全局 APlayer，避免双重播放
  useEffect(() => {
    if (!musicPlayerEnabled) return

    const pauseGlobalAPlayer = () => {
      const aplayer = document.querySelector('.aplayer')
      if (aplayer) {
        aplayer.style.display = 'none'
        const aplayerAudio = aplayer.querySelector('audio')
        if (aplayerAudio && !aplayerAudio.paused) {
          aplayerAudio.pause()
        }
      }
    }

    pauseGlobalAPlayer()
    const interval = setInterval(pauseGlobalAPlayer, 2000)
    const observer = new MutationObserver(pauseGlobalAPlayer)
    observer.observe(document.body, { childList: true, subtree: true })

    return () => {
      clearInterval(interval)
      observer.disconnect()
    }
  }, [musicPlayerEnabled])

  // 音频事件处理
  const handleTimeUpdate = useCallback(() => {
    if (isDraggingProgress) return
    const audio = audioRef.current
    if (!audio || !audio.duration) return
    setCurrentTime(audio.currentTime)
  }, [isDraggingProgress])

  const handleLoadedMetadata = useCallback(() => {
    const audio = audioRef.current
    if (audio) setDuration(audio.duration || 0)
  }, [])

  const handleEnded = useCallback(() => {
    playNext()
  }, [])

  // 播放控制
  const playTrack = useCallback((idx) => {
    if (!audioList || idx < 0 || idx >= audioList.length) return
    setCurrentIdx(idx)
    setIsPlaying(true)
  }, [audioList])

  const togglePlay = useCallback(() => {
    if (!audioRef.current) return
    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play().catch(() => {})
    }
  }, [isPlaying])

  const playNext = useCallback(() => {
    if (!audioList || audioList.length === 0) return
    if (order === 'random' && audioList.length > 1) {
      let next
      do { next = Math.floor(Math.random() * audioList.length) } while (next === currentIdx)
      playTrack(next)
    } else {
      playTrack((currentIdx + 1) % audioList.length)
    }
  }, [audioList, currentIdx, order, playTrack])

  const playPrev = useCallback(() => {
    if (!audioList || audioList.length === 0) return
    playTrack((currentIdx - 1 + audioList.length) % audioList.length)
  }, [audioList, currentIdx, playTrack])

  // 切换歌曲时加载新音频
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !currentTrack) return
    audio.src = currentTrack.url
    if (isPlaying) {
      audio.play().catch(() => setIsPlaying(false))
    }
  }, [currentIdx, currentTrack])

  // 播放状态同步
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    if (isPlaying) {
      audio.play().catch(() => setIsPlaying(false))
    } else {
      audio.pause()
    }
  }, [isPlaying])

  // 音量同步
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume
  }, [volume])

  // 进度条拖拽
  const handleSeek = useCallback((pct) => {
    const audio = audioRef.current
    if (!audio || !audio.duration) return
    const newTime = pct * audio.duration
    audio.currentTime = newTime
    setCurrentTime(newTime)
    setDragProgress(pct * 100)
  }, [])

  const handleProgressDragStart = useCallback(() => {
    setIsDraggingProgress(true)
  }, [])

  const handleProgressDragEnd = useCallback(() => {
    setIsDraggingProgress(false)
  }, [])

  // 窗口拖拽
  const handleWindowDragStart = useCallback((e) => {
    if (e.target.closest('button') || e.target.closest('input')) return
    setIsDraggingWindow(true)
    const rect = playerRef.current.getBoundingClientRect()
    dragOffset.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    }
    // 切换到 left/top 定位
    setPosition({
      left: rect.left,
      top: rect.top,
      right: null,
      bottom: null
    })
    e.preventDefault()
  }, [])

  const handleWindowDragMove = useCallback((e) => {
    if (!isDraggingWindow) return
    const playerWidth = playerRef.current?.offsetWidth || 300
    const playerHeight = playerRef.current?.offsetHeight || 100
    const x = Math.max(0, Math.min(window.innerWidth - playerWidth, e.clientX - dragOffset.current.x))
    const y = Math.max(0, Math.min(window.innerHeight - playerHeight, e.clientY - dragOffset.current.y))
    setPosition({ left: x, top: y, right: null, bottom: null })
  }, [isDraggingWindow])

  const handleWindowDragEnd = useCallback(() => {
    setIsDraggingWindow(false)
  }, [])

  useEffect(() => {
    if (isDraggingWindow) {
      window.addEventListener('mousemove', handleWindowDragMove)
      window.addEventListener('mouseup', handleWindowDragEnd)
      return () => {
        window.removeEventListener('mousemove', handleWindowDragMove)
        window.removeEventListener('mouseup', handleWindowDragEnd)
      }
    }
  }, [isDraggingWindow, handleWindowDragMove, handleWindowDragEnd])

  if (!musicPlayerEnabled || !audioList || audioList.length === 0) return null

  const progress = isDraggingProgress ? dragProgress : (duration ? (currentTime / duration) * 100 : 0)

  return (
    <>
      {/* 全局唯一音频元素 */}
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      <div
        ref={playerRef}
        className={`fixed z-40 transition-all duration-300 ease-out select-none ${
          isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        } ${isDraggingWindow ? 'transition-none cursor-grabbing' : ''}`}
        style={{
          left: position.left !== null ? `${position.left}px` : 'auto',
          top: position.top !== null ? `${position.top}px` : 'auto',
          right: position.right !== null ? `${position.right}px` : 'auto',
          bottom: position.bottom !== null ? `${position.bottom}px` : 'auto',
          maxWidth: 'calc(100vw - 32px)'
        }}
      >
        {/* 展开模式：完整播放器 */}
        {isExpanded && (
          <div className='glass-card p-4 w-72 sm:w-80 mb-2 shadow-2xl'>
            {/* 顶部拖拽区域 */}
            <div
              className='flex justify-between items-center mb-3 cursor-grab active:cursor-grabbing'
              onMouseDown={handleWindowDragStart}
            >
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
            <MusicPlayer
              currentTrack={currentTrack}
              isPlaying={isPlaying}
              progress={progress}
              duration={duration}
              currentTime={currentTime}
              volume={volume}
              showPlaylist={showPlaylist}
              audioList={audioList}
              currentIdx={currentIdx}
              isDragging={isDraggingProgress}
              onTogglePlay={togglePlay}
              onPlayNext={playNext}
              onPlayPrev={playPrev}
              onSeek={handleSeek}
              onVolumeChange={setVolume}
              onTogglePlaylist={() => setShowPlaylist(!showPlaylist)}
              onSelectTrack={(idx) => { playTrack(idx); setShowPlaylist(false) }}
              onProgressDragStart={handleProgressDragStart}
              onProgressDragEnd={handleProgressDragEnd}
            />
          </div>
        )}

        {/* 折叠模式：迷你播放器 */}
        {!isExpanded && (
          <div
            className='glass-card rounded-2xl shadow-xl cursor-pointer transition-all hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98]'
            onClick={() => setIsExpanded(true)}
          >
            <div className='flex items-center gap-2 p-2'>
              <div className='relative w-10 h-10 rounded-full overflow-hidden shrink-0 ring-1 ring-white/10 shadow-md'>
                {currentTrack?.cover ? (
                  <img
                    src={currentTrack.cover}
                    className={`w-full h-full object-cover ${isPlaying ? 'animate-spin-slow' : ''}`}
                    alt={currentTrack?.name}
                  />
                ) : (
                  <div className='w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-700'>
                    <i className='fas fa-music text-gray-400 text-sm' />
                  </div>
                )}
              </div>
              <div className='flex-1 min-w-0'>
                <div className='text-xs font-medium text-gray-700 dark:text-gray-200 truncate'>
                  {currentTrack?.name || '未知曲目'}
                </div>
                <div className='text-[10px] text-gray-500 dark:text-gray-400 truncate'>
                  {currentTrack?.artist || '未知艺术家'}
                </div>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); togglePlay() }}
                className='w-9 h-9 rounded-full flex items-center justify-center bg-gray-800 dark:bg-white text-white dark:text-gray-800 shadow-md hover:shadow-lg transition-all hover:scale-110 active:scale-95'
                title={isPlaying ? '暂停' : '播放'}
              >
                {isPlaying ? (
                  <svg className='w-4 h-4' viewBox='0 0 24 24' fill='currentColor'>
                    <path d='M6 5h4v14H6zm8 0h4v14h-4z' />
                  </svg>
                ) : (
                  <svg className='w-4 h-4 ml-0.5' viewBox='0 0 24 24' fill='currentColor'>
                    <path d='M8 5v14l11-7z' />
                  </svg>
                )}
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); playNext() }}
                className='w-8 h-8 rounded-full flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all'
                title='下一首'
              >
                <svg className='w-3.5 h-3.5' viewBox='0 0 24 24' fill='currentColor'>
                  <path d='M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z' />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

export default FloatingMusicPlayer
