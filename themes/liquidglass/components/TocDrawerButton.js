const TocDrawerButton = ({ onClick }) => {
  return (
    <div onClick={onClick} className='glass-float-btn cursor-pointer' title='目录'>
      <i className='fas fa-list text-gray-600 dark:text-gray-400 text-sm' />
    </div>
  )
}

export default TocDrawerButton