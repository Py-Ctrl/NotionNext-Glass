const GlassButton = ({
  label = '',
  btnStyle = 'transparent',
  onTap,
  width = '100%',
  height = '48px',
  className = '',
  fallbackClassName = ''
}) => {
  const styleMap = {
    blue: 'bg-indigo-500/90 hover:bg-indigo-500 text-white border-indigo-400/50',
    surface: 'glass-btn text-gray-700 dark:text-gray-300',
    transparent: 'glass-btn text-gray-700 dark:text-gray-300'
  }

  const baseClass = btnStyle === 'blue'
    ? 'flex items-center justify-center cursor-pointer rounded-2xl border backdrop-blur-md transition-all duration-200 hover:scale-[1.02] hover:shadow-lg'
    : 'glass-btn flex items-center justify-center cursor-pointer'

  return (
    <button
      onClick={onTap}
      className={`${baseClass} ${styleMap[btnStyle] || styleMap.transparent} ${fallbackClassName} ${className}`}
      style={{ width, height }}
    >
      {label}
    </button>
  )
}

export default GlassButton
