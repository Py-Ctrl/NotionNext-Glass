import { useRouter } from 'next/router'
import SearchInput from './SearchInput'
import { usePostListLayout } from './usePostListLayout'

const BlogListBar = (props) => {
  const router = useRouter()
  const { layout, changeLayout } = usePostListLayout()

  return (
    <div className='glass-card p-3 sm:p-4 mb-4 sm:mb-6 overflow-hidden'>
      <div className='flex items-center gap-2'>
        {router.asPath !== '/search' && (
          // 大屏（≥xl）右侧栏已提供唯一搜索框，此处的搜索框隐藏，避免同时出现两个
          <div className='flex-1 min-w-0 xl:hidden'>
            <SearchInput {...props} />
          </div>
        )}
        {/* 排列切换：网格悬停展开 / 纵向列表 */}
        <div className='glass-layout-toggle shrink-0' role='group' aria-label='排列方式'>
          <button
            type='button'
            title='网格（悬停展开）'
            aria-label='网格（悬停展开）'
            aria-pressed={layout === 'hover'}
            className={`glass-layout-btn ${layout === 'hover' ? 'active' : ''}`}
            onClick={() => changeLayout('hover')}>
            <i className='fas fa-table-cells-large' />
          </button>
          <button
            type='button'
            title='纵向列表'
            aria-label='纵向列表'
            aria-pressed={layout === 'list'}
            className={`glass-layout-btn ${layout === 'list' ? 'active' : ''}`}
            onClick={() => changeLayout('list')}>
            <i className='fas fa-list-ul' />
          </button>
        </div>
      </div>
    </div>
  )
}

export default BlogListBar
