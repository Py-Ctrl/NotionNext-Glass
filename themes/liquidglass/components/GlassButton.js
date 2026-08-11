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
    blue: 'liquid-glass-btn-blue',
    surface: 'liquid-glass-btn-surface',
    transparent: 'liquid-glass-btn-surface'
  }

  return (
    <button
      onClick={onTap}
      className={`liquid-glass-btn ${styleMap[btnStyle] || styleMap.transparent} ${fallbackClassName} ${className}`}
      style={{ width, height }}
    >
      {label}
    </button>
  )
}

export default GlassButton
