import { useRouter } from 'next/router'
import { useGlobal } from '@/lib/global'
import { useRef, useState } from 'react'
import { siteConfig } from '@/lib/config'
import CONFIG from '../config'

const SearchInput = ({ currentTag, keyword, onSearch, compact = false, searchModal }) => {
  const { locale } = useGlobal()
  const router = useRouter()
  const fallbackRef = useRef(null)
  const [showClean, setShowClean] = useState(false)

  const doSearch = (key) => {
    if (siteConfig('ALGOLIA_APP_ID') && searchModal?.current) {
      searchModal.current.openSearch()
      return
    }
    if (onSearch) {
      onSearch(key)
      return
    }
    if (key && key !== '') {
      router.push({ pathname: '/search/' + key })
    } else {
      router.push({ pathname: '/' })
    }
  }

  const handleKeyUp = (e) => {
    if (e.keyCode === 13) {
      doSearch(fallbackRef.current?.value || '')
    } else if (e.keyCode === 27) {
      if (fallbackRef.current) fallbackRef.current.value = ''
      setShowClean(false)
    }
  }

  const placeholder = currentTag
    ? `${locale.SEARCH.TAGS} #${currentTag}`
    : `${locale.SEARCH.ARTICLES}`

  return (
    <div className='glass-search flex w-full items-center'>
      <i className='fas fa-search text-gray-400 dark:text-gray-500 ml-4 text-sm' />
      <input
        ref={fallbackRef}
        type='text'
        placeholder={placeholder}
        className='outline-none w-full text-sm px-3 py-2.5 bg-transparent text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500'
        onKeyUp={handleKeyUp}
        onFocus={() => {
          if (siteConfig('ALGOLIA_APP_ID') && searchModal?.current) {
            searchModal.current.openSearch()
          }
        }}
        onChange={(e) => setShowClean(!!e.target.value)}
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
