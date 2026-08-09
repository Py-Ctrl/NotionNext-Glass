import { useEffect, useRef, useState } from 'react'
import { useGlobal } from '@/lib/global'

const SearchDrawer = ({ cRef, slot }) => {
  const [isVisible, setVisible] = useState(false)
  const drawerRef = useRef(null)

  useEffect(() => {
    if (cRef) {
      cRef.current = {
        show: () => setVisible(true),
        hide: () => setVisible(false)
      }
    }
  }, [cRef])

  useEffect(() => {
    if (isVisible) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isVisible])

  const handleClose = (e) => {
    if (e.target === drawerRef.current) {
      setVisible(false)
    }
  }

  if (!isVisible) return null

  return (
    <div
      ref={drawerRef}
      onClick={handleClose}
      className='fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/30 backdrop-blur-sm'>
      <div className='glass-card w-full max-w-lg mx-4 p-6 max-h-[80vh] overflow-y-auto'>
        <div className='flex justify-end mb-4'>
          <i
            className='fas fa-times text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer text-lg'
            onClick={() => setVisible(false)}
          />
        </div>
        {slot}
      </div>
    </div>
  )
}

export default SearchDrawer