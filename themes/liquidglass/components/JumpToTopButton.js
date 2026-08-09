const JumpToTopButton = ({ percent }) => {
  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div
      onClick={handleScrollToTop}
      className='glass-float-btn relative cursor-pointer'
      title='回到顶部'>
      <svg className='w-5 h-5' viewBox='0 0 24 24' fill='none'>
        <circle
          cx='12'
          cy='12'
          r='10'
          stroke='currentColor'
          strokeWidth='2'
          className='text-gray-300 dark:text-gray-600'
        />
        <circle
          cx='12'
          cy='12'
          r='10'
          stroke='#6366f1'
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
    </div>
  )
}

export default JumpToTopButton