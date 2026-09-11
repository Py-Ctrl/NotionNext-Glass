const StickyBar = ({ children, className }) => {
  return (
    <div className={`glass-nav sticky top-0 z-10 py-3 px-4 ${className || ''}`}>
      {children}
    </div>
  )
}

export default StickyBar