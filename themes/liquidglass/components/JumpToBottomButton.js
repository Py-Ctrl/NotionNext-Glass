import { useEffect, useState } from 'react'

const JumpToBottomButton = () => {
  const [isAtBottom, setIsAtBottom] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop
      const windowHeight = window.innerHeight
      const docHeight = document.documentElement.scrollHeight
      // 距离底部小于 100px 时视为已到底部
      setIsAtBottom(scrollTop + windowHeight >= docHeight - 100)
    }
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleScroll)
    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleScroll)
    }
  }, [])

  if (isAtBottom) return null

  const handleScrollToBottom = () => {
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
  }

  return (
    <div
      onClick={handleScrollToBottom}
      className='liquid-glass-toggle cursor-pointer'
      title='跳到底部'>
      <span className='liquid-glass-toggle-inner'>
        <i className='fas fa-chevron-down text-gray-600 dark:text-gray-400 text-sm' />
      </span>
    </div>
  )
}

export default JumpToBottomButton