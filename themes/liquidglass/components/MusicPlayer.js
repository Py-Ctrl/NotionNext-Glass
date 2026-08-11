import { useEffect, useRef, useState, useCallback } from 'react'
import { siteConfig } from '@/lib/config'
import LazyImage from '@/components/LazyImage'

const MusicPlayer = () => {
  const audioList = siteConfig('MUSIC_PLAYER_AUDIO_LIST')
  const autoPlay = JSON.parse(siteConfig('MUSIC_PLAYER_AUTO_PLAY'))
  const order = siteConfig('MUSIC_PLAYER_ORDER')

  const audioRef = useRef(null)
  const [currentIdx, setCurrentIdx] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [volume, setVolume] = useState(0.7)
  const [showPlaylist, setShowPlaylist] = useState(false)
  const draggingRef = useRef(false)
  const progressRef = useRef(null)

  const currentTrack = audioList?.[currentIdx]

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

  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !currentTrack) return

    audio.src = currentTrack.url
    if (isPlaying) {
      audio.play().catch(() => {
        setIsPlaying(false)
      })
    }
  }, [currentIdx])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    if (isPlaying) {
      audio.play().catch(() => setIsPlaying(false))
    } else {
      audio.pause()
    }
  }, [isPlaying])

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume
  }, [volume])

  useEffect(() => {
    if (autoPlay && audioList && audioList.length > 0) {
      setIsPlaying(true)
    }
  }, [])

  // 桌面端暂停全局 APlayer，避免双重播放
  useEffect(() => {
    const pauseGlobalAPlayer = () => {
      const aplayerAudio = document.querySelector('.aplayer.aplayer-fixed audio')
      if (aplayerAudio && !aplayerAudio.paused) {
        aplayerAudio.pause()
      }
      const aplayerPlayBtn = document.querySelector('.aplayer.aplayer-fixed .aplayer-play')
      if (aplayerPlayBtn) {
        aplayerPlayBtn.click()
      }
    }

    pauseGlobalAPlayer()
    const interval = setInterval(pauseGlobalAPlayer, 2000)

    const observer = new MutationObserver(() => {
      const aplayerAudio = document.querySelector('.aplayer.aplayer-fixed audio')
      if (aplayerAudio && !aplayerAudio.paused) {
        aplayerAudio.pause()
      }
    })
    observer.observe(document.body, { childList: true, subtree: true })

    return () => {
      clearInterval(interval)
      observer.disconnect()
    }
  }, [])

  const handleTimeUpdate = () => {
    if (draggingRef.current) return
    const audio = audioRef.current
    if (!audio || !audio.duration) return
    setCurrentTime(audio.currentTime)
    setProgress((audio.currentTime / audio.duration) * 100)
  }

  const handleLoadedMetadata = () => {
    const audio = audioRef.current
    if (audio) setDuration(audio.duration || 0)
  }

  const handleEnded = () => { playNext() }

  const seekTo = (clientX) => {
    const audio = audioRef.current
    const bar = progressRef.current
    if (!audio || !audio.duration || !bar) return
    const rect = bar.getBoundingClientRect()
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    audio.currentTime = pct * audio.duration
    setProgress(pct * 100)
    setCurrentTime(pct * audio.duration)
  }

  const handlePointerDown = (e) => {
    draggingRef.current = true
    e.currentTarget.setPointerCapture(e.pointerId)
    seekTo(e.clientX)
  }

  const handlePointerMove = (e) => {
    if (!draggingRef.current) return
    seekTo(e.clientX)
  }

  const handlePointerUp = (e) => {
    if (!draggingRef.current) return
    draggingRef.current = false
    e.currentTarget.releasePointerCapture(e.pointerId)
    seekTo(e.clientX)
  }

  const formatTime = (sec) => {
    if (!sec || isNaN(sec)) return '0:00'
    const m = Math.floor(sec / 60)
    const s = Math.floor(sec % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  if (!audioList || audioList.length === 0) return null

  return (
    <div className='glass-music-player'>
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      {/* 封面 + 信息 */}
      <div className='flex items-center gap-3 mb-3'>
        <div className='relative w-12 h-12 rounded-lg overflow-hidden shrink-0 ring-1 ring-white/20'>
          {currentTrack?.cover ? (
            <LazyImage
              src={currentTrack.cover}
              className={`w-full h-full object-cover ${isPlaying ? 'animate-spin-slow' : ''}`}
              width={48}
              height={48}
              alt={currentTrack?.name}
            />
          ) : (
            <div className='w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-700'>
              <i className='fas fa-music text-gray-400' />
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
      </div>

      {/* 进度条 — 支持拖动 */}
      <div className='mb-2'>
        <div
          ref={progressRef}
          className='group h-1.5 rounded-full bg-gray-200/50 dark:bg-gray-700/50 cursor-pointer relative touch-none'
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <div
            className='absolute h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 pointer-events-none'
            style={{ width: `${progress}%` }}
          />
          <div
            className='absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-white shadow-md pointer-events-none transition-transform group-hover:scale-110'
            style={{ left: `calc(${progress}% - 7px)` }}
          />
        </div>
        <div className='flex justify-between mt-1 text-[10px] text-gray-400 dark:text-gray-500 tabular-nums'>
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* 控制按钮 */}
      <div className='flex items-center justify-center gap-2 mb-2'>
        <button
          onClick={playPrev}
          className='glass-float-btn !w-8 !h-8 !rounded-full flex items-center justify-center'
          title='上一首'
        >
          <svg className='w-3.5 h-3.5' viewBox='0 0 24 24' fill='currentColor'>
            <path d='M6 6h2v12H6zm3.5 6l8.5 6V6z' />
          </svg>
        </button>
        <button
          onClick={togglePlay}
          className='glass-float-btn !w-10 !h-10 !rounded-full flex items-center justify-center !bg-indigo-500/20 hover:!bg-indigo-500/30'
          title={isPlaying ? '暂停' : '播放'}
        >
          {isPlaying ? (
            <svg className='w-4 h-4' viewBox='0 0 24 24' fill='currentColor'>
              <path d='M6 5h4v14H6zm8 0h4v14h-4z' />
            </svg>
          ) : (
            <svg className='w-4 h-4' viewBox='0 0 24 24' fill='currentColor'>
              <path d='M8 5v14l11-7z' />
            </svg>
          )}
        </button>
        <button
          onClick={playNext}
          className='glass-float-btn !w-8 !h-8 !rounded-full flex items-center justify-center'
          title='下一首'
        >
          <svg className='w-3.5 h-3.5' viewBox='0 0 24 24' fill='currentColor'>
            <path d='M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z' />
          </svg>
        </button>
      </div>

      {/* 音量 + 列表 */}
      <div className='flex items-center gap-2'>
        <div className='flex items-center gap-1 flex-1'>
          <button
            onClick={() => setVolume(volume > 0 ? 0 : 0.7)}
            className='text-gray-400 hover:text-indigo-500 transition-colors'
            title={volume > 0 ? '静音' : '取消静音'}
          >
            {volume > 0 ? (
              <svg className='w-3 h-3' viewBox='0 0 24 24' fill='currentColor'>
                <path d='M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z' />
              </svg>
            ) : (
              <svg className='w-3 h-3' viewBox='0 0 24 24' fill='currentColor'>
                <path d='M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z' />
              </svg>
            )}
          </button>
          <input
            type='range'
            min='0'
            max='1'
            step='0.01'
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className='flex-1 h-1 rounded-full appearance-none bg-gray-200/50 dark:bg-gray-700/50 cursor-pointer
                       [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5
                       [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-indigo-500
                       [&::-webkit-slider-thumb]:cursor-pointer'
          />
        </div>
        {audioList.length > 1 && (
          <button
            onClick={() => setShowPlaylist(!showPlaylist)}
            className={`text-gray-400 hover:text-indigo-500 transition-colors ${showPlaylist ? 'text-indigo-500' : ''}`}
            title='播放列表'
          >
            <svg className='w-3.5 h-3.5' viewBox='0 0 24 24' fill='currentColor'>
              <path d='M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z' />
            </svg>
          </button>
        )}
      </div>

      {/* 播放列表 */}
      {showPlaylist && audioList.length > 1 && (
        <div className='mt-3 pt-3 border-t border-gray-200/30 dark:border-gray-700/30 max-h-32 overflow-y-auto'>
          {audioList.map((track, idx) => (
            <button
              key={idx}
              onClick={() => { playTrack(idx); setShowPlaylist(false) }}
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left text-xs transition-colors
                          ${idx === currentIdx
                    ? 'text-indigo-500 bg-indigo-500/10'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-white/10 dark:hover:bg-white/5'
                  }`}
            >
              <span className='w-4 text-center shrink-0'>
                {idx === currentIdx && isPlaying ? (
                  <svg className='w-3 h-3 inline-block animate-pulse' viewBox='0 0 24 24' fill='currentColor'>
                    <path d='M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z' />
                  </svg>
                ) : (
                  <span className='tabular-nums'>{idx + 1}</span>
                )}
              </span>
              <span className='truncate flex-1'>{track.name}</span>
              {track.artist && (
                <span className='text-[10px] text-gray-400 truncate max-w-[60px]'>{track.artist}</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default MusicPlayer
