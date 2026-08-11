const TocDrawerButton = ({ onClick }) => {
  return (
    <div onClick={onClick} className='liquid-glass-toggle cursor-pointer' title='目录'>
      <span className='liquid-glass-toggle-inner'>
        <i className='fas fa-list text-gray-600 dark:text-gray-400 text-sm' />
      </span>
    </div>
  )
}

export default TocDrawerButton