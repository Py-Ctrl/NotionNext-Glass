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
              ? 'bg-liquid-100 dark:bg-liquid-900/40 border-liquid-300 dark:border-liquid-700 text-liquid-700 dark:text-liquid-400'
              : ''
          }`}>
          {category.name} ({category.count})
        </SmartLink>
      ))}
    </div>
  )
}

export default CategoryGroup