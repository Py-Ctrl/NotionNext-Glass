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
    <button
      onClick={handleChangeDarkMode}
      className='liquid-glass-toggle cursor-pointer select-none relative overflow-hidden'
      title={isDarkMode ? '切换浅色模式' : '切换深色模式'}>
      <span className='liquid-glass-toggle-inner'>
        {isDarkMode ? (
          <i className='fas fa-sun text-yellow-400 text-sm' />
        ) : (
          <i className='fas fa-moon text-indigo-500 text-sm' />
        )}
      </span>
    </button>
  )
}

export default DarkModeButton
