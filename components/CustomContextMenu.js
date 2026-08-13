import useWindowSize from '@/hooks/useWindowSize'
import { siteConfig } from '@/lib/config'
import { useGlobal } from '@/lib/global'
import { THEMES, saveDarkModeToLocalStorage } from '@/themes/theme'
import SmartLink from '@/components/SmartLink'
import { useRouter } from 'next/router'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'

/**
 * 检测是否为触摸设备（移动端）
 */
function isTouchDevice() {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia?.('(pointer: coarse)').matches ||
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0
  )
}

/**
 * 自定义右键菜单（玻璃态美化版）
 * @param {*} props
 * @returns
 */
export default function CustomContextMenu(props) {
  const [position, setPosition] = useState({ x: '0px', y: '0px' })
  const [show, setShow] = useState(false)
  const { isDarkMode, updateDarkMode, locale } = useGlobal()
  const menuRef = useRef(null)
  const windowSize = useWindowSize()
  const [width, setWidth] = useState(0)
  const [height, setHeight] = useState(0)
  const [isMobile, setIsMobile] = useState(false)

  const { allNavPages } = props
  const router = useRouter()

  // 客户端挂载后检测设备类型
  useEffect(() => {
    setIsMobile(isTouchDevice())
  }, [])

  /**
   * 随机跳转文章
   */
  function handleJumpToRandomPost() {
    const randomIndex = Math.floor(Math.random() * allNavPages.length)
    const randomPost = allNavPages[randomIndex]
    router.push(`${siteConfig('SUB_PATH', '')}/${randomPost?.slug}`)
  }

  useLayoutEffect(() => {
    if (menuRef.current) {
      setWidth(menuRef.current.offsetWidth)
      setHeight(menuRef.current.offsetHeight)
    }
  }, [])

  useEffect(() => {
    setShow(false)
  }, [router])

  useEffect(() => {
    // 移动端不触发右键菜单
    if (isMobile) return

    const handleContextMenu = event => {
      event.preventDefault()
      // 计算点击位置加菜单宽高是否超出屏幕，如果超出则贴边弹出
      const x =
        event.clientX < windowSize.width - width
          ? event.clientX
          : Math.max(0, windowSize.width - width)
      const y =
        event.clientY < windowSize.height - height
          ? event.clientY
          : Math.max(0, windowSize.height - height)
      setPosition({ y: `${y}px`, x: `${x}px` })
      setShow(true)
    }

    /**
     * 鼠标点击即关闭菜单
     */
    const handleClick = () => {
      setShow(false)
    }

    /**
     * ESC 关闭菜单
     */
    const handleKeyDown = e => {
      if (e.key === 'Escape') setShow(false)
    }

    window.addEventListener('contextmenu', handleContextMenu)
    window.addEventListener('click', handleClick)
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('contextmenu', handleContextMenu)
      window.removeEventListener('click', handleClick)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [windowSize, width, height, isMobile])

  function handleBack() {
    window.history.back()
  }

  function handleForward() {
    window.history.forward()
  }

  function handleRefresh() {
    window.location.reload()
  }

  function handleScrollTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleCopyLink() {
    const url = window.location.href
    navigator.clipboard
      .writeText(url)
      .then(() => {
        alert(`${locale.COMMON.PAGE_URL_COPIED} : ${url}`)
      })
      .catch(error => {
        console.error('复制页面地址失败:', error)
      })
  }

  /**
   * 切换主题
   */
  function handleChangeTheme() {
    const randomTheme = THEMES[Math.floor(Math.random() * THEMES.length)]
    const query = router.query
    query.theme = randomTheme
    router.push({ pathname: router.pathname, query })
  }

  /**
   * 复制内容
   */
  function handleCopy() {
    const selectedText = document.getSelection().toString()
    if (selectedText) {
      const tempInput = document.createElement('input')
      tempInput.value = selectedText
      document.body.appendChild(tempInput)
      tempInput.select()
      document.execCommand('copy')
      if (tempInput && tempInput.parentNode && tempInput.parentNode.contains(tempInput)) {
        tempInput.parentNode.removeChild(tempInput)
      }
    }
  }

  function handleChangeDarkMode() {
    const newStatus = !isDarkMode
    saveDarkModeToLocalStorage(newStatus)
    updateDarkMode(newStatus)
    const htmlElement = document.getElementsByTagName('html')[0]
    htmlElement.classList?.remove(newStatus ? 'light' : 'dark')
    htmlElement.classList?.add(newStatus ? 'dark' : 'light')
  }

  // 配置变量
  const CUSTOM_RIGHT_CLICK_CONTEXT_MENU_RANDOM_POST = siteConfig(
    'CUSTOM_RIGHT_CLICK_CONTEXT_MENU_RANDOM_POST'
  )
  const CUSTOM_RIGHT_CLICK_CONTEXT_MENU_CATEGORY = siteConfig(
    'CUSTOM_RIGHT_CLICK_CONTEXT_MENU_CATEGORY'
  )
  const CUSTOM_RIGHT_CLICK_CONTEXT_MENU_TAG = siteConfig(
    'CUSTOM_RIGHT_CLICK_CONTEXT_MENU_TAG'
  )
  const CAN_COPY = props.canCopy ?? siteConfig('CAN_COPY')
  const CUSTOM_RIGHT_CLICK_CONTEXT_MENU_SHARE_LINK = siteConfig(
    'CUSTOM_RIGHT_CLICK_CONTEXT_MENU_SHARE_LINK'
  )
  const CUSTOM_RIGHT_CLICK_CONTEXT_MENU_DARK_MODE = siteConfig(
    'CUSTOM_RIGHT_CLICK_CONTEXT_MENU_DARK_MODE'
  )
  const CUSTOM_RIGHT_CLICK_CONTEXT_MENU_THEME_SWITCH = siteConfig(
    'CUSTOM_RIGHT_CLICK_CONTEXT_MENU_THEME_SWITCH'
  )

  // 菜单项通用样式
  const menuItemClass =
    'group w-full px-3 h-9 flex justify-start items-center flex-nowrap cursor-pointer rounded-lg duration-200 transition-all hover:bg-white/60 dark:hover:bg-white/10 hover:scale-[1.02] hover:shadow-sm'

  // 顶部图标按钮通用样式
  const iconBtnClass =
    'h-8 w-8 flex items-center justify-center leading-none rounded-lg cursor-pointer duration-200 transition-all hover:bg-white/60 dark:hover:bg-white/10 hover:scale-110 text-gray-600 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400'

  return (
    <div
      ref={menuRef}
      style={{ top: position.y, left: position.x }}
      className={`${
        show ? 'opacity-100 scale-100' : 'invisible opacity-0 scale-95 pointer-events-none'
      } select-none fixed z-50 transition-all duration-200 ease-out origin-top-left`}>
      {/* 玻璃态菜单容器 */}
      <div className='rounded-2xl w-52 p-2.5 border border-white/40 dark:border-white/10 bg-white/70 dark:bg-black/60 backdrop-blur-xl shadow-2xl shadow-black/10 dark:shadow-black/40 text-gray-700 dark:text-gray-200 flex-col duration-300 transition-colors'>
        {/* 顶部导航按钮 */}
        <div className='flex justify-between gap-1 px-1'>
          <i onClick={handleBack} className={`${iconBtnClass} fa-solid fa-arrow-left`} />
          <i onClick={handleForward} className={`${iconBtnClass} fa-solid fa-arrow-right`} />
          <i onClick={handleRefresh} className={`${iconBtnClass} fa-solid fa-rotate-right`} />
          <i onClick={handleScrollTop} className={`${iconBtnClass} fa-solid fa-arrow-up`} />
        </div>

        <div className='my-2 mx-1 h-px bg-gradient-to-r from-transparent via-gray-300/50 dark:via-gray-600/50 to-transparent' />

        {/* 跳转导航按钮 */}
        <div className='w-full px-1 flex flex-col gap-0.5'>
          {CUSTOM_RIGHT_CLICK_CONTEXT_MENU_RANDOM_POST && (
            <div
              onClick={handleJumpToRandomPost}
              title={locale.MENU.WALK_AROUND}
              className={menuItemClass}>
              <i className='fa-solid fa-podcast mr-2.5 text-blue-500 dark:text-blue-400' />
              <div className='whitespace-nowrap text-sm'>{locale.MENU.WALK_AROUND}</div>
            </div>
          )}

          {CUSTOM_RIGHT_CLICK_CONTEXT_MENU_CATEGORY && (
            <SmartLink
              href='/category'
              title={locale.MENU.CATEGORY}
              className={menuItemClass}>
              <i className='fa-solid fa-square-minus mr-2.5 text-purple-500 dark:text-purple-400' />
              <div className='whitespace-nowrap text-sm'>{locale.MENU.CATEGORY}</div>
            </SmartLink>
          )}

          {CUSTOM_RIGHT_CLICK_CONTEXT_MENU_TAG && (
            <SmartLink href='/tag' title={locale.MENU.TAGS} className={menuItemClass}>
              <i className='fa-solid fa-tag mr-2.5 text-pink-500 dark:text-pink-400' />
              <div className='whitespace-nowrap text-sm'>{locale.MENU.TAGS}</div>
            </SmartLink>
          )}
        </div>

        <div className='my-2 mx-1 h-px bg-gradient-to-r from-transparent via-gray-300/50 dark:via-gray-600/50 to-transparent' />

        {/* 功能按钮 */}
        <div className='w-full px-1 flex flex-col gap-0.5'>
          {CAN_COPY && (
            <div onClick={handleCopy} title={locale.MENU.COPY} className={menuItemClass}>
              <i className='fa-solid fa-copy mr-2.5 text-green-500 dark:text-green-400' />
              <div className='whitespace-nowrap text-sm'>{locale.MENU.COPY}</div>
            </div>
          )}

          {CUSTOM_RIGHT_CLICK_CONTEXT_MENU_SHARE_LINK && (
            <div
              onClick={handleCopyLink}
              title={locale.MENU.SHARE_URL}
              className={menuItemClass}>
              <i className='fa-solid fa-arrow-up-right-from-square mr-2.5 text-cyan-500 dark:text-cyan-400' />
              <div className='whitespace-nowrap text-sm'>{locale.MENU.SHARE_URL}</div>
            </div>
          )}

          {CUSTOM_RIGHT_CLICK_CONTEXT_MENU_DARK_MODE && (
            <div
              onClick={handleChangeDarkMode}
              title={isDarkMode ? locale.MENU.LIGHT_MODE : locale.MENU.DARK_MODE}
              className={menuItemClass}>
              {isDarkMode ? (
                <i className='fa-regular fa-sun mr-2.5 text-amber-500 dark:text-amber-400' />
              ) : (
                <i className='fa-regular fa-moon mr-2.5 text-indigo-500 dark:text-indigo-400' />
              )}
              <div className='whitespace-nowrap text-sm'>
                {isDarkMode ? locale.MENU.LIGHT_MODE : locale.MENU.DARK_MODE}
              </div>
            </div>
          )}

          {CUSTOM_RIGHT_CLICK_CONTEXT_MENU_THEME_SWITCH && (
            <div
              onClick={handleChangeTheme}
              title={locale.MENU.THEME_SWITCH}
              className={menuItemClass}>
              <i className='fa-solid fa-palette mr-2.5 text-rose-500 dark:text-rose-400' />
              <div className='whitespace-nowrap text-sm'>{locale.MENU.THEME_SWITCH}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
