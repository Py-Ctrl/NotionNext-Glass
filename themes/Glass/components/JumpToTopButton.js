const JumpToTopButton = ({ percent }) => {
  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div
      onClick={handleScrollToTop}
      className='liquid-glass-toggle cursor-pointer relative'
      title='回到顶部'>
      <span className='liquid-glass-toggle-inner'>
      <svg className='w-5 h-5' viewBox='0 0 24 24' fill='none'>
        <circle
          cx='12'
          cy='12'
          r='10'
          stroke='currentColor'
          strokeWidth='2'
          className='text-gray-300 dark:text-gray-600'
        />
        {/* 进度环：stroke 必须走 style 而不是表现属性 —— SVG 表现属性不解析 var()，
            写成 style 才能跟着 #theme-glass 上的 --glass-accent-rgb 换色 */}
        <circle
          cx='12'
          cy='12'
          r='10'
          style={{ stroke: 'rgb(var(--glass-accent-rgb))' }}
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
      </span>
    </div>
  )
}

export default JumpToTopButton
