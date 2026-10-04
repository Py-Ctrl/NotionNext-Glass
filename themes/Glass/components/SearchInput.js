import { useRouter } from 'next/router'
import { useGlobal } from '@/lib/global'
import { useRef, useState } from 'react'
import { siteConfig } from '@/lib/config'

const SearchInput = ({ currentTag, keyword, onSearch, compact = false, searchModal }) => {
  const { locale } = useGlobal()
  const router = useRouter()
  const fallbackRef = useRef(null)
  const [showClean, setShowClean] = useState(false)

  const placeholder = currentTag
    ? `${locale.SEARCH.TAGS} #${currentTag}`
    : `${locale.SEARCH.ARTICLES}`

  // 配了 Algolia：这里只渲染一个按钮 —— 真正的输入框在玻璃搜索模态里。
  // 否则页面上会同时出现两个"搜索框"（侧栏一个 + 模态一个）
  if (siteConfig('ALGOLIA_APP_ID') && searchModal) {
    return (
      <button
        type='button'
        onClick={() => searchModal.current?.openSearch()}
        aria-label={placeholder}
        className='glass-search flex w-full cursor-pointer items-center text-left'>
        <i className='fas fa-search text-gray-400 dark:text-gray-500 ml-4 text-sm' />
        <span className='flex-1 truncate px-3 py-2.5 text-sm text-gray-400 dark:text-gray-500'>
          {placeholder}
        </span>
        <kbd className='mr-4 rounded border border-gray-300/60 px-1.5 py-0.5 text-[10px] leading-none text-gray-400 dark:border-gray-600/60 dark:text-gray-500'>
          Ctrl K
        </kbd>
      </button>
    )
  }

  // 没配 Algolia：退回真输入框，回车跳 /search/<关键词>
  const doSearch = key => {
    if (onSearch) {
      onSearch(key)
      return
    }
    router.push({ pathname: key ? '/search/' + key : '/' })
  }

  const handleFallbackKeyUp = e => {
    if (e.keyCode === 13) {
      doSearch(fallbackRef.current?.value || '')
    } else if (e.keyCode === 27) {
      if (fallbackRef.current) fallbackRef.current.value = ''
      setShowClean(false)
    }
  }

  return (
    <div className='glass-search flex w-full items-center'>
      <i className='fas fa-search text-gray-400 dark:text-gray-500 ml-4 text-sm' />
      <input
        ref={fallbackRef}
        type='text'
        placeholder={placeholder}
        className='outline-none w-full text-sm px-3 py-2.5 bg-transparent text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500'
        onKeyUp={handleFallbackKeyUp}
        onChange={e => setShowClean(!!e.target.value)}
        defaultValue={keyword || ''}
      />
      {showClean && (
        <i
          className='fas fa-times text-gray-400 dark:text-gray-500 mr-4 cursor-pointer hover:text-gray-600 dark:hover:text-gray-300'
          onClick={() => {
            if (fallbackRef.current) {
              fallbackRef.current.value = ''
              setShowClean(false)
            }
          }}
        />
      )}
    </div>
  )
}

export default SearchInput
