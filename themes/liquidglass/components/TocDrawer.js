import { useEffect, useRef, useState } from 'react'

const TocDrawer = ({ post, cRef, targetRef }) => {
  const [isVisible, setIsVisible] = useState(false)
  const [tocItems, setTocItems] = useState([])
  const drawerRef = useRef(null)

  useEffect(() => {
    if (cRef) {
      cRef.current = {
        handleSwitchVisible: () => setIsVisible(prev => !prev),
        show: () => setIsVisible(true),
        hide: () => setIsVisible(false)
      }
    }
  }, [cRef])

  // 从文章中提取标题
  useEffect(() => {
    if (!isVisible) return
    const wrapper = document.getElementById('article-wrapper')
    if (!wrapper) return
    const headings = wrapper.querySelectorAll('h1, h2, h3, h4, h5, h6')
    const items = []
    headings.forEach((h, i) => {
      if (!h.id) h.id = `toc-heading-${i}`
      items.push({
        id: h.id,
        text: h.textContent?.replace(/[#*`]/g, '').trim() || `标题 ${i + 1}`,
        level: parseInt(h.tagName[1])
      })
    })
    setTocItems(items)
  }, [isVisible, post])

  useEffect(() => {
    if (isVisible) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isVisible])

  useEffect(() => {
    if (!isVisible) return
    const handleEsc = (e) => {
      if (e.keyCode === 27) setIsVisible(false)
    }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [isVisible])

  const handleClick = (e) => {
    if (e.target === drawerRef.current) {
      setIsVisible(false)
    }
  }

  const scrollToHeading = (id) => {
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      setIsVisible(false)
    }
  }

  if (!isVisible) return null

  return (
    <div
      ref={drawerRef}
      onClick={handleClick}
      className='fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/30 backdrop-blur-sm'>
      <div className='glass-card w-full sm:max-w-md max-h-[70vh] overflow-y-auto rounded-b-none sm:rounded-2xl p-4 sm:p-6'>
        <div className='flex items-center justify-between mb-4'>
          <h3 className='text-sm font-medium text-gray-700 dark:text-gray-300'>
            <i className='fas fa-list mr-2 text-indigo-400' />
            目录
          </h3>
          <i
            className='fas fa-times text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer'
            onClick={() => setIsVisible(false)}
          />
        </div>
        {tocItems.length === 0 ? (
          <p className='text-sm text-gray-400 dark:text-gray-500 text-center py-4'>
            暂无目录
          </p>
        ) : (
          <nav className='space-y-1'>
            {tocItems.map((item, idx) => (
              <div
                key={idx}
                onClick={() => scrollToHeading(item.id)}
                className='text-sm text-gray-600 dark:text-gray-400 hover:text-indigo-500 dark:hover:text-indigo-400 cursor-pointer transition-colors py-1.5 px-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50'
                style={{ paddingLeft: `${(item.level - 1) * 12 + 8}px` }}>
                {item.text}
              </div>
            ))}
          </nav>
        )}
      </div>
    </div>
  )
}

export default TocDrawer
