import { useGlobal } from '@/lib/global'
import SmartLink from '@/components/SmartLink'
import { useRouter } from 'next/router'

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
    <div className='flex justify-center gap-2 mt-8'>
      {currentPage > 1 && (
        <SmartLink
          href={`/page/${currentPage - 1}`}
          className='glass-btn text-gray-600 dark:text-gray-400'>
          <i className='fas fa-chevron-left' />
        </SmartLink>
      )}
      {pages.map(p => (
        <SmartLink
          key={p}
          href={p === 1 ? '/' : `/page/${p}`}
          className={`glass-btn ${
            p === currentPage
              ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border-indigo-300 dark:border-indigo-700'
              : 'text-gray-600 dark:text-gray-400'
          }`}>
          {p}
        </SmartLink>
      ))}
      {currentPage < totalPage && (
        <SmartLink
          href={`/page/${currentPage + 1}`}
          className='glass-btn text-gray-600 dark:text-gray-400'>
          <i className='fas fa-chevron-right' />
        </SmartLink>
      )}
    </div>
  )
}

export default PaginationNumber