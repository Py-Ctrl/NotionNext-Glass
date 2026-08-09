const PaginationSimple = ({ page, totalPage }) => {
  if (!totalPage || totalPage <= 1) return null

  return (
    <div className='flex justify-center gap-4 mt-8 text-sm text-gray-500 dark:text-gray-400'>
      <span>{page || 1} / {totalPage}</span>
    </div>
  )
}

export default PaginationSimple