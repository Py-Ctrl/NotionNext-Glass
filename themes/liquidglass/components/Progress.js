const Progress = ({ percent }) => {
  return (
    <div className='fixed top-0 left-0 w-full h-0.5 z-50'>
      <div
        className='h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-150'
        style={{ width: `${percent || 0}%` }}
      />
    </div>
  )
}

export default Progress