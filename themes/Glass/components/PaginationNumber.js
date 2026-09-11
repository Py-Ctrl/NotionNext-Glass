import { useGlobal } from '@/lib/global'
import { useRouter } from 'next/router'
import GlassButton from './GlassButton'

const PaginationNumber = ({ page, totalPage }) => {
  const router = useRouter()
  const { locale } = useGlobal()
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

  const btn = (p, style, label) => (
    <GlassButton
      label={label}
      btnStyle={style}
      onTap={() => goToPage(p)}
      width='48px'
      height='48px'
      className='rounded-xl'
    />
  )

  return (
    <div className='flex justify-center items-center gap-2 mt-8 mb-4 flex-wrap'>
      {currentPage > 1 && btn(currentPage - 1, 'surface', '<')}

      {start > 1 && (
        <>
          {btn(1, 'surface', '1')}
          {start > 2 && <span className='text-gray-400 px-1'>...</span>}
        </>
      )}

      {pages.map(p => (
        <div key={p} className='contents'>
          {btn(p, p === currentPage ? 'blue' : 'surface', String(p))}
        </div>
      ))}

      {end < totalPage && (
        <>
          {end < totalPage - 1 && <span className='text-gray-400 px-1'>...</span>}
          {btn(totalPage, 'surface', String(totalPage))}
        </>
      )}

      {currentPage < totalPage && btn(currentPage + 1, 'surface', '>')}
    </div>
  )
}

export default PaginationNumber
