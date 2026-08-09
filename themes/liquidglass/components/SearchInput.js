import { useRouter } from 'next/router'
import { useGlobal } from '@/lib/global'
import { useRef, useState } from 'react'
import { siteConfig } from '@/lib/config'

let lock = false

const SearchInput = ({ currentTag, keyword, cRef, onSearch }) => {
  const { locale } = useGlobal()
  const [onLoading, setLoadingState] = useState(false)
  const router = useRouter()
  const searchInputRef = useRef()
  const [showClean, setShowClean] = useState(false)

  const handleSearch = () => {
    if (onSearch) {
      onSearch(searchInputRef.current.value)
      return
    }
    const key = searchInputRef.current.value
    if (key && key !== '') {
      setLoadingState(true)
      router.push({ pathname: '/search/' + key }).then(() => {
        setLoadingState(false)
      })
    } else {
      router.push({ pathname: '/' })
    }
  }

  const handleKeyUp = (e) => {
    if (e.keyCode === 13) {
      handleSearch()
    } else if (e.keyCode === 27) {
      cleanSearch()
    }
  }

  const cleanSearch = () => {
    searchInputRef.current.value = ''
    setShowClean(false)
  }

  const updateSearchKey = (val) => {
    if (lock) return
    searchInputRef.current.value = val
    setShowClean(!!val)
  }

  return (
    <div className='glass-search flex w-full items-center'>
      <i className='fas fa-search text-gray-400 dark:text-gray-500 ml-4 text-sm' />
      <input
        ref={searchInputRef}
        type='text'
        placeholder={
          currentTag
            ? `${locale.SEARCH.TAGS} #${currentTag}`
            : `${locale.SEARCH.ARTICLES}`
        }
        className='outline-none w-full text-sm px-3 py-2.5 bg-transparent text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500'
        onKeyUp={handleKeyUp}
        onCompositionStart={() => { lock = true }}
        onCompositionUpdate={() => { lock = true }}
        onCompositionEnd={() => { lock = false }}
        onChange={e => updateSearchKey(e.target.value)}
        defaultValue={keyword || ''}
      />
      {showClean && (
        <i
          className='fas fa-times text-gray-400 dark:text-gray-500 mr-4 cursor-pointer hover:text-gray-600 dark:hover:text-gray-300'
          onClick={cleanSearch}
        />
      )}
    </div>
  )
}

export default SearchInput