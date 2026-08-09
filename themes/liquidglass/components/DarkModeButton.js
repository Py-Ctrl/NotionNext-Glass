import { useGlobal } from '@/lib/global'
import { saveDarkModeToLocalStorage } from '@/themes/theme'

const DarkModeButton = () => {
  const { isDarkMode, updateDarkMode } = useGlobal()

  const handleChangeDarkMode = () => {
    const newStatus = !isDarkMode
    saveDarkModeToLocalStorage(newStatus)
    updateDarkMode(newStatus)
    const htmlElement = document.getElementsByTagName('html')[0]
    htmlElement.classList?.remove(newStatus ? 'light' : 'dark')
    htmlElement.classList?.add(newStatus ? 'dark' : 'light')
  }

  return (
    <div
      onClick={handleChangeDarkMode}
      className='glass-float-btn cursor-pointer select-none'
      title={isDarkMode ? '切换浅色模式' : '切换深色模式'}>
      {isDarkMode ? (
        <i className='fas fa-sun text-yellow-400 text-sm' />
      ) : (
        <i className='fas fa-moon text-indigo-500 text-sm' />
      )}
    </div>
  )
}

export default DarkModeButton