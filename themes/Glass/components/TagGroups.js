import { useGlobal } from '@/lib/global'
import SmartLink from '@/components/SmartLink'
import TagItemMini from './TagItemMini'

const TagGroups = ({ tags, currentTag }) => {
  if (!tags || tags.length === 0) return null

  return (
    <div className='flex flex-wrap gap-2'>
      {tags.map(tag => (
        <TagItemMini
          key={tag.name}
          tag={tag}
          selected={currentTag === tag.name}
        />
      ))}
    </div>
  )
}

export default TagGroups