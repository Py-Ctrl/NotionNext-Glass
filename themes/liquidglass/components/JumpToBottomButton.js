const JumpToBottomButton = () => {
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