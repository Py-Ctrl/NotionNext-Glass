import { useRef, useState, useEffect, useCallback } from 'react'
import { siteConfig } from '@/lib/config'
import MusicPlayer from './MusicPlayer'

/**
 * 全局悬浮音乐播放器
 * - 折叠/展开共用同一音频实例
 * - 高性能窗口拖拽（transform + requestAnimationFrame）
 * - 折叠和展开模式都支持拖拽
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

  // 拖拽相关 refs（避免重渲染）
  const playerRef = useRef(null)
  const dragState = useRef({
    isDragging: false,
    startX: 0,
    startY: 0,
    offsetX: 0,
    offsetY: 0,
    currentX: 0,
    currentY: 0,
    rafId: null,
    moved: false
  })
  // 初始位置（右下角）
  const initialPos = useRef({ right: 16, bottom: 80 })
  const [useTransform, setUseTransform] = useState(false)

  const currentTrack = audioList?.[currentIdx]

  // 延迟显示
  useEffect(() => {
    if (musicPlayerEnabled) {
      const timer = setTimeout(() => setIsVisible(true), 800)
      return () => clearTimeout(timer)
    }
  }, [musicPlayerEnabled])

  // 组件挂载时暂停所有音频，避免刷新后浏览器自动恢复音频导致双重播放
  useEffect(() => {
    if (!musicPlayerEnabled) return
    const audio = audioRef.current
    if (audio) {
      audio.pause()
      audio.removeAttribute('src')
      audio.load()
    }
    // 同时暂停页面上可能存在的其他音频元素
    document.querySelectorAll('audio').forEach(a => {
      if (a !== audioRef.current) {
        a.pause()
      }
    })
  }, [musicPlayerEnabled])

  // 组件卸载时暂停音频，避免 SPA 路由切换后音频继续播放
  useEffect(() => {
    return () => {
      const audio = audioRef.current
      if (audio) {
        audio.pause()
        audio.removeAttribute('src')
        audio.load()
      }
    }
  }, [])

  // 彻底禁用全局 APlayer（避免双重播放）
  useEffect(() => {
    if (!musicPlayerEnabled) return
    const disableAPlayer = () => {
      const aplayers = document.querySelectorAll('.aplayer')
      aplayers.forEach(aplayer => {
        aplayer.style.display = 'none'
        const aplayerAudio = aplayer.querySelector('audio')
        if (aplayerAudio) {
          aplayerAudio.pause()
          aplayerAudio.removeAttribute('src')
          aplayerAudio.load()
        }
      })
    }
    disableAPlayer()
    const interval = setInterval(disableAPlayer, 1000)
    const observer = new MutationObserver(disableAPlayer)
    observer.observe(document.body, { childList: true, subtree: true })
    return () => {
      clearInterval(interval)
      observer.disconnect()
    }
  }, [musicPlayerEnabled])

  // 音频事件
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

  const handleEnded = useCallback(() => { playNext() }, [])

  // 播放控制
  const playTrack = useCallback((idx) => {
    if (!audioList || idx < 0 || idx >= audioList.length) return
    setCurrentIdx(idx)
    setIsPlaying(true)
  }, [audioList])

  const togglePlay = useCallback(() => {
    if (!audioRef.current) return
    if (isPlaying) audioRef.current.pause()
    else audioRef.current.play().catch(() => {})
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

  // 仅在曲目变化时设置 src（跳过首次挂载，防止 BFCache 自动恢复播放）
  const srcInitialized = useRef(false)
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !currentTrack) return
    if (!srcInitialized.current) {
      srcInitialized.current = true
      return
    }
    audio.src = currentTrack.url
    if (isPlaying) audio.play().catch(() => setIsPlaying(false))
  }, [currentIdx, currentTrack])

  // play/pause 控制（不碰 src，保留播放进度）
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    if (isPlaying) {
      // 播放前杀掉页面上所有其他音频（APlayer 等），防止双重播放
      document.querySelectorAll('audio').forEach(a => {
        if (a !== audio) a.pause()
      })
      // 首次播放时 src 尚未设置，补上
      if (!audio.src && currentTrack) {
        audio.src = currentTrack.url
      }
      audio.play().catch(() => setIsPlaying(false))
    } else {
      audio.pause()
    }
  }, [isPlaying])

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

  // ========== 高性能窗口拖拽（Pointer Events，同时支持鼠标和触摸） ==========
  const applyTransform = useCallback(() => {
    const el = playerRef.current
    if (!el) return
    const s = dragState.current
    const maxX = window.innerWidth - el.offsetWidth
    const maxY = window.innerHeight - el.offsetHeight
    s.currentX = Math.max(0, Math.min(maxX, s.currentX))
    s.currentY = Math.max(0, Math.min(maxY, s.currentY))
    el.style.transform = `translate(${s.currentX}px, ${s.currentY}px)`
    s.rafId = null
  }, [])

  const onPointerMove = useCallback((e) => {
    const s = dragState.current
    if (!s.isDragging) return
    s.currentX = e.clientX - s.offsetX
    s.currentY = e.clientY - s.offsetY
    // 判断是否移动了足够距离（区分点击和拖拽）
    if (Math.abs(e.clientX - s.startX) > 5 || Math.abs(e.clientY - s.startY) > 5) {
      s.moved = true
    }
    if (!s.rafId) {
      s.rafId = requestAnimationFrame(applyTransform)
    }
  }, [applyTransform])

  const onPointerUp = useCallback(() => {
    const s = dragState.current
    if (!s.isDragging) return
    s.isDragging = false
    if (s.rafId) {
      cancelAnimationFrame(s.rafId)
      s.rafId = null
    }
    // 最终位置应用
    applyTransform()
    window.removeEventListener('pointermove', onPointerMove)
    window.removeEventListener('pointerup', onPointerUp)
    window.removeEventListener('pointercancel', onPointerUp)
    document.body.style.userSelect = ''
    document.body.style.cursor = ''
  }, [onPointerMove, applyTransform])

  const startDrag = useCallback((e) => {
    // 不拦截按钮和输入框
    if (e.target.closest('button') || e.target.closest('input')) return
    e.preventDefault()
    const el = playerRef.current
    if (!el) return
    const s = dragState.current
    const rect = el.getBoundingClientRect()
    // 立即切换到 transform 定位，避免 React 重渲染延迟
    if (!useTransform) {
      setUseTransform(true)
      el.style.left = '0'
      el.style.top = '0'
      el.style.right = 'auto'
      el.style.bottom = 'auto'
    }
    s.currentX = rect.left
    s.currentY = rect.top
    el.style.transform = `translate(${s.currentX}px, ${s.currentY}px)`
    s.isDragging = true
    s.moved = false
    s.startX = e.clientX
    s.startY = e.clientY
    s.offsetX = e.clientX - rect.left
    s.offsetY = e.clientY - rect.top
    document.body.style.userSelect = 'none'
    document.body.style.cursor = 'grabbing'
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
    window.addEventListener('pointercancel', onPointerUp)
  }, [useTransform, onPointerMove, onPointerUp])

  // 清理
  useEffect(() => {
    return () => {
      const s = dragState.current
      if (s.rafId) cancelAnimationFrame(s.rafId)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('pointercancel', onPointerUp)
    }
  }, [onPointerMove, onPointerUp])

  if (!musicPlayerEnabled || !audioList || audioList.length === 0) return null

  const progress = isDraggingProgress ? dragProgress : (duration ? (currentTime / duration) * 100 : 0)

  // 折叠模式点击（区分拖拽和点击）
  const handleCompactClick = () => {
    if (!dragState.current.moved) {
      setIsExpanded(true)
    }
  }

  return (
    <>
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
        className={`fixed z-40 transition-opacity duration-300 ease-out select-none ${
          isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        style={{
          right: useTransform ? 'auto' : `${initialPos.current.right}px`,
          bottom: useTransform ? 'auto' : `${initialPos.current.bottom}px`,
          left: useTransform ? 0 : 'auto',
          top: useTransform ? 0 : 'auto',
          transform: useTransform ? `translate(${dragState.current.currentX}px, ${dragState.current.currentY}px)` : 'none',
          willChange: 'transform',
          maxWidth: 'calc(100vw - 32px)'
        }}
      >
        {/* 展开模式 */}
        {isExpanded && (
          <div className='glass-card p-4 w-72 sm:w-80 mb-2 shadow-2xl'>
            <div
              className='flex justify-between items-center mb-3 cursor-grab active:cursor-grabbing'
              onPointerDown={startDrag}
              style={{ touchAction: 'none' }}
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
              onProgressDragStart={() => setIsDraggingProgress(true)}
              onProgressDragEnd={() => setIsDraggingProgress(false)}
            />
          </div>
        )}

        {/* 折叠模式 */}
        {!isExpanded && (
          <div
            className='glass-card rounded-2xl shadow-xl cursor-grab active:cursor-grabbing transition-shadow hover:shadow-2xl relative'
            onPointerDown={startDrag}
            onClick={handleCompactClick}
            style={{ touchAction: 'none' }}
          >
            <div className='flex items-center gap-2 p-2'>
              <div
                className='relative w-10 h-10 shrink-0 ring-1 ring-white/10 shadow-md'
                style={{ clipPath: 'circle(50%)', WebkitClipPath: 'circle(50%)' }}
              >
                {currentTrack?.cover ? (
                  <img
                    src={currentTrack.cover}
                    className='w-full h-full object-cover scale-110 animate-spin-slow'
                    style={{ animationPlayState: isPlaying ? 'running' : 'paused' }}
                    alt={currentTrack?.name}
                    draggable={false}
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
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => { e.stopPropagation(); togglePlay() }}
                className='w-9 h-9 rounded-full flex items-center justify-center bg-gray-800 dark:bg-white text-white dark:text-gray-800 shadow-md hover:shadow-lg transition-all hover:scale-110 active:scale-95 shrink-0'
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
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => { e.stopPropagation(); playNext() }}
                className='w-8 h-8 rounded-full flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all shrink-0'
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
