import { useGlobal } from '@/lib/global'
import { useRouter } from 'next/router'
import LiquidGlassButton from './LiquidGlassButton'

const PaginationNumber = ({ page, totalPage }) => {
  const router = useRouter()
  const currentPage = page || 1

  if (!totalPage || totalPage <= 1) return null

  // 生成页码列表：显示当前页附近的页码，最多5个
  const maxVisible = 5
  let start = Math.max(1, currentPage - Math.floor(maxVisible / 2))
  let end = Math.min(totalPage, start + maxVisible - 1)
  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1)
  }
  const pages = []
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }

  const goToPage = (p) => {
    if (p === 1) router.push('/')
    else router.push(`/page/${p}`)
  }

  return (
    <div className='flex justify-center items-center gap-2 mt-8 mb-4 flex-wrap'>
      {currentPage > 1 && (
        <div className='rounded-xl overflow-hidden' style={{ width: '48px', height: '48px' }}>
          <LiquidGlassButton
            label='<'
            btnStyle='surface'
            onTap={() => goToPage(currentPage - 1)}
            width='48px'
            height='48px'
            className='rounded-xl overflow-hidden'
          />
        </div>
      )}

      {start > 1 && (
        <>
          <div className='rounded-xl overflow-hidden' style={{ width: '48px', height: '48px' }}>
            <LiquidGlassButton
              label='1'
              btnStyle='surface'
              onTap={() => goToPage(1)}
              width='48px'
              height='48px'
              className='rounded-xl overflow-hidden'
            />
          </div>
          {start > 2 && <span className='text-gray-400 px-1'>...</span>}
        </>
      )}

      {pages.map(p => (
        <div
          key={p}
          className='rounded-xl overflow-hidden'
          style={{ width: '48px', height: '48px' }}
        >
          <LiquidGlassButton
            label={String(p)}
            btnStyle={p === currentPage ? 'blue' : 'surface'}
            onTap={() => goToPage(p)}
            width='48px'
            height='48px'
            className='rounded-xl overflow-hidden'
          />
        </div>
      ))}

      {end < totalPage && (
        <>
          {end < totalPage - 1 && <span className='text-gray-400 px-1'>...</span>}
          <div className='rounded-xl overflow-hidden' style={{ width: '48px', height: '48px' }}>
            <LiquidGlassButton
              label={String(totalPage)}
              btnStyle='surface'
              onTap={() => goToPage(totalPage)}
              width='48px'
              height='48px'
              className='rounded-xl overflow-hidden'
            />
          </div>
        </>
      )}

      {currentPage < totalPage && (
        <div className='rounded-xl overflow-hidden' style={{ width: '48px', height: '48px' }}>
          <LiquidGlassButton
            label='>'
            btnStyle='surface'
            onTap={() => goToPage(currentPage + 1)}
            width='48px'
            height='48px'
            className='rounded-xl overflow-hidden'
          />
        </div>
      )}
    </div>
  )
}

export default PaginationNumber
