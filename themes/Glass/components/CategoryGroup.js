import SmartLink from '@/components/SmartLink'

const CategoryGroup = ({ categories, currentCategory }) => {
  if (!categories || categories.length === 0) return null

  return (
    <div className='flex flex-wrap gap-2'>
      {categories.map(category => (
        <SmartLink
          key={category.name}
          href={`/category/${category.name}`}
          className={`glass-tag inline-block ${
            currentCategory === category.name
              ? 'bg-indigo-100 dark:bg-indigo-900/30 border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400'
              : ''
          }`}>
          {category.name} ({category.count})
        </SmartLink>
      ))}
    </div>
  )
}

export default CategoryGroup