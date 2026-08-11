import { useRef, useState, useEffect, useCallback } from 'react'

/**
 * 解析 LRC 格式歌词
 * @param {string} lrcText - LRC 格式的歌词文本
 * @returns {Array<{time: number, text: string}>} 解析后的歌词数组
 */
const parseLRC = (lrcText) => {
  if (!lrcText) return []
  const lines = lrcText.split('\n')
  const result = []
  const timeRegex = /\[(\d{1,2}):(\d{1,2})(?:\.(\d{1,3}))?\]/g

  for (const line of lines) {
    const matches = [...line.matchAll(timeRegex)]
    const text = line.replace(timeRegex, '').trim()
    if (!text) continue
    for (const match of matches) {
      const minutes = parseInt(match[1], 10)
      const seconds = parseInt(match[2], 10)
      const ms = match[3] ? parseInt(match[3].padEnd(3, '0'), 10) : 0
      const time = minutes * 60 + seconds + ms / 1000
      result.push({ time, text })
    }
  }
  return result.sort((a, b) => a.time - b.time)
}

/**
 * 格式化时间为 mm:ss
 */
const formatTime = (sec) => {
  if (!sec || isNaN(sec)) return '0:00'
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

/**
 * 音乐播放器 UI 组件（纯展示，播放逻辑由父组件控制）
 */
const MusicPlayer = ({
  currentTrack,
  isPlaying,
  progress,
  duration,
  currentTime,
  volume,
  showPlaylist,
  audioList,
  currentIdx,
  onTogglePlay,
  onPlayNext,
  onPlayPrev,
  onSeek,
  onVolumeChange,
  onTogglePlaylist,
  onSelectTrack,
  onProgressDragStart,
  onProgressDragMove,
  onProgressDragEnd,
  isDragging
}) => {
  const progressRef = useRef(null)
  const [lyrics, setLyrics] = useState([])
  const [currentLyricIdx, setCurrentLyricIdx] = useState(-1)

  // 解析歌词
  useEffect(() => {
    if (currentTrack?.lrc) {
      setLyrics(parseLRC(currentTrack.lrc))
    } else {
      setLyrics([])
    }
    setCurrentLyricIdx(-1)
  }, [currentTrack])

  // 更新当前歌词
  useEffect(() => {
    if (lyrics.length === 0) return
    let idx = -1
    for (let i = 0; i < lyrics.length; i++) {
      if (currentTime >= lyrics[i].time) {
        idx = i
      } else {
        break
      }
    }
    setCurrentLyricIdx(idx)
  }, [currentTime, lyrics])

  const handlePointerDown = (e) => {
    onProgressDragStart?.()
    e.currentTarget.setPointerCapture(e.pointerId)
    seekTo(e.clientX)
  }

  const handlePointerMove = (e) => {
    if (!isDragging) return
    seekTo(e.clientX)
  }

  const handlePointerUp = (e) => {
    if (!isDragging) return
    e.currentTarget.releasePointerCapture(e.pointerId)
    seekTo(e.clientX)
    onProgressDragEnd?.()
  }

  const seekTo = (clientX) => {
    const bar = progressRef.current
    if (!bar) return
    const rect = bar.getBoundingClientRect()
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    onSeek?.(pct)
  }

  return (
    <div className='music-player-ui'>
      {/* 封面 + 信息 + 字幕 */}
      <div className='flex items-start gap-3 mb-3'>
        <div
          className='relative w-14 h-14 shrink-0 ring-1 ring-white/10 shadow-md'
          style={{ clipPath: 'circle(50%)', WebkitClipPath: 'circle(50%)' }}
        >
          {currentTrack?.cover ? (
            <img
              src={currentTrack.cover}
              className={`w-full h-full object-cover scale-110 ${isPlaying ? 'animate-spin-slow' : ''}`}
              alt={currentTrack?.name}
              draggable={false}
            />
          ) : (
            <div className='w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-700'>
              <i className='fas fa-music text-gray-400' />
            </div>
          )}
        </div>
        <div className='flex-1 min-w-0 pt-1'>
          <div className='text-sm font-semibold text-gray-800 dark:text-gray-100 truncate'>
            {currentTrack?.name || '未知曲目'}
          </div>
          <div className='text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5'>
            {currentTrack?.artist || '未知艺术家'}
          </div>
          {/* 字幕/歌词显示 */}
          <div className='mt-1.5 h-4 overflow-hidden'>
            {lyrics.length > 0 && currentLyricIdx >= 0 ? (
              <div className='text-xs text-gray-600 dark:text-gray-300 truncate animate-[fadeIn_0.3s_ease]'>
                {lyrics[currentLyricIdx]?.text}
              </div>
            ) : (
              <div className='text-xs text-gray-400 dark:text-gray-500 truncate italic'>
                {isPlaying ? '正在播放...' : '已暂停'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 进度条 — 支持拖动 */}
      <div className='mb-3'>
        <div
          ref={progressRef}
          className='group h-1.5 rounded-full bg-gray-200/60 dark:bg-gray-700/60 cursor-pointer relative touch-none select-none'
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <div
            className='absolute h-full rounded-full bg-gray-700 dark:bg-gray-200 pointer-events-none'
            style={{ width: `${progress}%` }}
          />
          <div
            className='absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white dark:bg-gray-100 shadow-md pointer-events-none transition-transform group-hover:scale-125'
            style={{ left: `calc(${progress}% - 6px)` }}
          />
        </div>
        <div className='flex justify-between mt-1.5 text-[10px] text-gray-400 dark:text-gray-500 tabular-nums font-medium'>
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* 控制按钮 */}
      <div className='flex items-center justify-center gap-4 mb-3'>
        <button
          onClick={onPlayPrev}
          className='w-8 h-8 rounded-full flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all hover:scale-110 active:scale-95'
          title='上一首'
        >
          <svg className='w-4 h-4' viewBox='0 0 24 24' fill='currentColor'>
            <path d='M6 6h2v12H6zm3.5 6l8.5 6V6z' />
          </svg>
        </button>
        <button
          onClick={onTogglePlay}
          className='w-11 h-11 rounded-full flex items-center justify-center bg-gray-800 dark:bg-white text-white dark:text-gray-800 shadow-lg hover:shadow-xl transition-all hover:scale-110 active:scale-95'
          title={isPlaying ? '暂停' : '播放'}
        >
          {isPlaying ? (
            <svg className='w-5 h-5' viewBox='0 0 24 24' fill='currentColor'>
              <path d='M6 5h4v14H6zm8 0h4v14h-4z' />
            </svg>
          ) : (
            <svg className='w-5 h-5 ml-0.5' viewBox='0 0 24 24' fill='currentColor'>
              <path d='M8 5v14l11-7z' />
            </svg>
          )}
        </button>
        <button
          onClick={onPlayNext}
          className='w-8 h-8 rounded-full flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all hover:scale-110 active:scale-95'
          title='下一首'
        >
          <svg className='w-4 h-4' viewBox='0 0 24 24' fill='currentColor'>
            <path d='M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z' />
          </svg>
        </button>
      </div>

      {/* 音量 + 列表 */}
      <div className='flex items-center gap-2'>
        <div className='flex items-center gap-1.5 flex-1'>
          <button
            onClick={() => onVolumeChange?.(volume > 0 ? 0 : 0.7)}
            className='text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors shrink-0'
            title={volume > 0 ? '静音' : '取消静音'}
          >
            {volume > 0 ? (
              <svg className='w-3.5 h-3.5' viewBox='0 0 24 24' fill='currentColor'>
                <path d='M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z' />
              </svg>
            ) : (
              <svg className='w-3.5 h-3.5' viewBox='0 0 24 24' fill='currentColor'>
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
            onChange={(e) => onVolumeChange?.(parseFloat(e.target.value))}
            className='flex-1 h-1 rounded-full appearance-none bg-gray-200/60 dark:bg-gray-700/60 cursor-pointer
                       [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5
                       [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gray-600 dark:[&::-webkit-slider-thumb]:bg-gray-300
                       [&::-webkit-slider-thumb]:cursor-pointer'
          />
        </div>
        {audioList?.length > 1 && (
          <button
            onClick={onTogglePlaylist}
            className={`p-1.5 rounded-lg transition-all ${showPlaylist ? 'text-gray-800 dark:text-gray-100 bg-gray-100 dark:bg-gray-800' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
            title='播放列表'
          >
            <svg className='w-4 h-4' viewBox='0 0 24 24' fill='currentColor'>
              <path d='M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z' />
            </svg>
          </button>
        )}
      </div>

      {/* 播放列表 */}
      {showPlaylist && audioList?.length > 1 && (
        <div className='mt-3 pt-3 border-t border-gray-200/30 dark:border-gray-700/30 max-h-40 overflow-y-auto space-y-0.5'>
          {audioList.map((track, idx) => (
            <button
              key={idx}
              onClick={() => onSelectTrack?.(idx)}
              className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left text-xs transition-all
                          ${idx === currentIdx
                            ? 'text-gray-800 dark:text-gray-100 bg-gray-100 dark:bg-gray-800 font-medium'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                          }`}
            >
              <span className='w-5 text-center shrink-0'>
                {idx === currentIdx && isPlaying ? (
                  <div className='flex items-end justify-center gap-0.5 h-3'>
                    <span className='w-0.5 bg-gray-600 dark:bg-gray-300 rounded-full animate-pulse' style={{ height: '40%' }} />
                    <span className='w-0.5 bg-gray-600 dark:bg-gray-300 rounded-full animate-pulse' style={{ height: '80%', animationDelay: '0.2s' }} />
                    <span className='w-0.5 bg-gray-600 dark:bg-gray-300 rounded-full animate-pulse' style={{ height: '60%', animationDelay: '0.4s' }} />
                  </div>
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
