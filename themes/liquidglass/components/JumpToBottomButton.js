const JumpToBottomButton = () => {
  const handleScrollToBottom = () => {
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
  }

  return (
    <div
      onClick={handleScrollToBottom}
      className='glass-float-btn cursor-pointer'
      title='跳到底部'>
      <i className='fas fa-chevron-down text-gray-600 dark:text-gray-400 text-sm' />
    </div>
  )
}

export default JumpToBottomButton