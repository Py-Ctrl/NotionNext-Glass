/**
 * 玻璃搜索界面 —— 替代共用 AlgoliaSearchModal 的 UI，后端仍是 Algolia。
 * 对外 API 与共用版一致（ref 上的 openSearch()），所以 SearchInput / 下拉手势都能直接调。
 */
import replaceSearchResult from '@/components/Mark'
import { siteConfig } from '@/lib/config'
import { useGlobal } from '@/lib/global'
import algoliasearch from 'algoliasearch'
import throttle from 'lodash/throttle'
import { useRouter } from 'next/router'
import {
  useEffect,
  useImperativeHandle,
  useRef,
  useState
} from 'react'
import { useHotkeys } from 'react-hotkeys-hook'

const SEARCH_ID = 'glass-search'

export default function GlassSearchModal({ cRef }) {
  const [searchResults, setSearchResults] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [page, setPage] = useState(0)
  const [keyword, setKeyword] = useState(null)
  const [totalPage, setTotalPage] = useState(0)
  const [totalHit, setTotalHit] = useState(0)
  const [useTime, setUseTime] = useState(0)
  const [activeIndex, setActiveIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [isInputFocused, setIsInputFocused] = useState(false)

  const inputRef = useRef(null)
  const router = useRouter()
  const { isDarkMode } = useGlobal()

  const openSearch = () => setIsModalOpen(true)

  useHotkeys('ctrl+k', e => {
    e.preventDefault()
    setIsModalOpen(true)
  })
  useHotkeys('down', e => {
    if (!isInputFocused) return
    e.preventDefault()
    setActiveIndex(i => Math.min(i + 1, searchResults.length - 1))
  }, { enableOnFormTags: true })
  useHotkeys('up', e => {
    if (!isInputFocused) return
    e.preventDefault()
    setActiveIndex(i => Math.max(i - 1, 0))
  }, { enableOnFormTags: true })
  useHotkeys('esc', e => {
    // 只要模态开着就关 —— 不能要求 isInputFocused：按下鼠标时输入框已失焦
    if (!isModalOpen) return
    e.preventDefault()
    setIsModalOpen(false)
  }, { enableOnFormTags: true })
  useHotkeys('enter', e => {
    if (!isInputFocused || searchResults.length === 0) return
    jumpToResult(activeIndex)
  }, { enableOnFormTags: true })

  const jumpToResult = i => {
    const r = searchResults[i]
    if (!r) return
    window.location.href = `${siteConfig('SUB_PATH', '')}/${r.slug || r.objectID}`
  }

  const resetSearch = () => {
    setActiveIndex(0)
    setKeyword('')
    setSearchResults([])
    setUseTime(0)
    setTotalPage(0)
    setTotalHit(0)
    if (inputRef.current) inputRef.current.value = ''
  }

  // 路由变化后自动关闭
  useEffect(() => { setIsModalOpen(false) }, [router])

  // 打开后聚焦（移动端等键盘弹出）
  useEffect(() => {
    if (!isModalOpen) { resetSearch(); return }
    const timer = setTimeout(() => {
      inputRef.current?.focus()
      if (typeof window !== 'undefined' && window.innerWidth < 1024) inputRef.current?.click()
    }, 50)
    return () => clearTimeout(timer)
  }, [isModalOpen])

  useImperativeHandle(cRef, () => ({ openSearch }))

  const client = algoliasearch(
    siteConfig('ALGOLIA_APP_ID'),
    siteConfig('ALGOLIA_SEARCH_ONLY_APP_KEY')
  )
  const index = client.initIndex(siteConfig('ALGOLIA_INDEX'))

  const handleSearch = async (query, page) => {
    setKeyword(query)
    setPage(page)
    setSearchResults([])
    setUseTime(0)
    setTotalPage(0)
    setTotalHit(0)
    setActiveIndex(0)
    if (!query) return
    setIsLoading(true)
    try {
      const res = await index.search(query, { page, hitsPerPage: 10 })
      const { hits, nbHits, nbPages, processingTimeMS } = res
      setUseTime(processingTimeMS)
      setTotalPage(nbPages)
      setTotalHit(nbHits)
      setSearchResults(hits)
      setIsLoading(false)
      // 高亮命中词：延时等结果 DOM 落地
      setTimeout(() => {
        const wrap = document.getElementById(SEARCH_ID)
        if (!wrap) return
        replaceSearchResult({
          doms: wrap.getElementsByClassName('replace'),
          search: query,
          target: { element: 'span', className: 'font-bold border-b border-dashed' }
        })
      }, 200)
    } catch (error) {
      console.error('Algolia search error:', error)
      setIsLoading(false)
    }
  }

  const throttledSearch = useRef(throttle((q, p = 0) => handleSearch(q, p), 1000))
  const searchTimer = useRef(null)
  const handleInputChange = e => {
    const query = e.target.value
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => throttledSearch.current(query), 800)
  }
  const switchPage = p => throttledSearch.current(keyword, p)

  if (!siteConfig('ALGOLIA_APP_ID')) return <></>

  const borderCol = isDarkMode ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.35)'
  const fg = isDarkMode ? '#f5f5f7' : '#1f2937'
  const fgDim = isDarkMode ? 'rgba(245,245,247,0.55)' : 'rgba(31,41,55,0.55)'
  const rowHover = isDarkMode ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)'
  const accent = isDarkMode ? '#0091FF' : '#0088FF'
  const fieldBg = isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.55)'

  // 玻璃质感交给主题的 .glass-card（CSS 变量 + ::before 边框光晕），
  // 这里只保留布局相关的内联样式，避免两边打架
  const panel = {
    width: '100%',
    maxWidth: '640px',
    marginTop: '10vh',
    color: fg
  }

  return (
    <div
      id={SEARCH_ID}
      className={`${isModalOpen ? 'opacity-100' : 'invisible opacity-0 pointer-events-none'} fixed left-0 top-0 z-30 flex h-screen w-screen items-start justify-center transition-opacity duration-200`}
      style={{ padding: '0 16px' }}>
      <div style={{ position: 'fixed', inset: 0 }} onClick={() => setIsModalOpen(false)} />

      <div className='glass-card' style={panel}>
        {/* 输入行 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 18px' }}>
          <svg width='20' height='20' viewBox='0 0 24 24' fill='none' stroke={fgDim}
            strokeWidth='2' strokeLinecap='round' style={{ flex: '0 0 auto' }}>
            <circle cx='11' cy='11' r='7' />
            <path d='M20 20l-3.5-3.5' />
          </svg>
          <input
            ref={inputRef}
            type='text'
            placeholder='搜索文章…'
            onChange={handleInputChange}
            onFocus={() => setIsInputFocused(true)}
            onBlur={() => setIsInputFocused(false)}
            style={{
              flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent',
              fontSize: 16, color: fg, padding: '2px 0'
            }}
          />
          {isLoading
            ? <span style={{ fontSize: 12, color: fgDim }}>搜索中…</span>
            : <kbd style={{ fontSize: 11, color: fgDim, border: `1px solid ${borderCol}`, borderRadius: 6, padding: '2px 6px' }}>ESC</kbd>}
        </div>

        {/* 结果 */}
        {(searchResults.length > 0 || keyword) && (
          <div style={{ borderTop: `1px solid ${borderCol}`, maxHeight: '50vh', overflowY: 'auto' }}>
            {searchResults.length === 0 && !isLoading && keyword && (
              <p style={{ margin: 0, padding: '28px 18px', textAlign: 'center', fontSize: 14, color: fgDim }}>
                没有找到与「{keyword}」相关的内容
              </p>
            )}
            {searchResults.map((r, i) => (
              <div
                key={r.objectID || i}
                onClick={() => jumpToResult(i)}
                onMouseEnter={() => setActiveIndex(i)}
                style={{
                  padding: '12px 18px',
                  cursor: 'pointer',
                  background: i === activeIndex ? rowHover : 'transparent',
                  borderLeft: `2px solid ${i === activeIndex ? accent : 'transparent'}`
                }}>
                <div className='replace' style={{ fontSize: 15, fontWeight: 500, marginBottom: 4 }}>
                  {r.title}
                </div>
                <div className='replace' style={{ fontSize: 13, color: fgDim, lineHeight: 1.5,
                  display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {r.summary || r.content || r.slug}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 底栏：命中数 / 用时 / 分页 */}
        {searchResults.length > 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 18px', borderTop: `1px solid ${borderCol}`, fontSize: 12, color: fgDim
          }}>
            <span>{totalHit} 条结果 · {useTime}ms</span>
            {totalPage > 1 && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button type='button' disabled={page <= 0} onClick={() => switchPage(page - 1)}
                  style={{ background: 'none', border: 'none', color: page <= 0 ? fgDim : accent, cursor: page <= 0 ? 'default' : 'pointer', fontSize: 12 }}>
                  上一页
                </button>
                <span>{page + 1} / {totalPage}</span>
                <button type='button' disabled={page >= totalPage - 1} onClick={() => switchPage(page + 1)}
                  style={{ background: 'none', border: 'none', color: page >= totalPage - 1 ? fgDim : accent, cursor: page >= totalPage - 1 ? 'default' : 'pointer', fontSize: 12 }}>
                  下一页
                </button>
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
