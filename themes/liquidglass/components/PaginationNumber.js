import { useGlobal } from '@/lib/global'
import SmartLink from '@/components/SmartLink'
import { useRouter } from 'next/router'
import GlassButton from './GlassButton'

const PaginationNumber = ({ page, totalPage }) => {
  const { locale } = useGlobal()
  const router = useRouter()
  const currentPage = page || 1

  if (!totalPage || totalPage <= 1) return null

  const pages = []
  for (let i = 1; i <= Math.min(totalPage, 5); i++) {
    pages.push(i)
  }

  return (
    <div className='flex justify-center items-center gap-2 mt-8 flex-wrap'>
      {currentPage > 1 && (
        <div className='rounded-xl overflow-hidden' style={{ width: '48px', height: '48px' }}>
          <GlassButton
            label='←'
            btnStyle='surface'
            onTap={() => router.push(`/page/${currentPage - 1}`)}
            width='48px'
            height='48px'
            className='rounded-xl overflow-hidden'
          />
        </div>
      )}
      {pages.map(p => (
        <div
          key={p}
          className='rounded-xl overflow-hidden'
          style={{ width: '48px', height: '48px' }}
        >
          <GlassButton
            label={String(p)}
            btnStyle={p === currentPage ? 'blue' : 'surface'}
            onTap={() => router.push(p === 1 ? '/' : `/page/${p}`)}
            width='48px'
            height='48px'
            className='rounded-xl overflow-hidden'
          />
        </div>
      ))}
      {currentPage < totalPage && (
        <div className='rounded-xl overflow-hidden' style={{ width: '48px', height: '48px' }}>
          <GlassButton
            label='→'
            btnStyle='surface'
            onTap={() => router.push(`/page/${currentPage + 1}`)}
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
