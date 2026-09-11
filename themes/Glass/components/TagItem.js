import { useGlobal } from '@/lib/global'
import SmartLink from '@/components/SmartLink'

const TagItem = ({ tag }) => {
  return (
    <SmartLink
      href={`/tag/${encodeURIComponent(tag.name)}`}
      className='glass-tag inline-block'>
      <i className='fas fa-tag mr-1 text-xs' />
      {tag.name + (tag.count ? ` (${tag.count})` : '')}
    </SmartLink>
  )
}

export default TagItem