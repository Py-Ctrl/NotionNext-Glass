import SmartLink from '@/components/SmartLink'

const TagItemMini = ({ tag, selected = false }) => {
  return (
    <SmartLink
      href={`/tag/${encodeURIComponent(tag.name)}`}
      className={`glass-tag inline-block ${
        selected
          ? 'bg-indigo-100 dark:bg-indigo-900/30 border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400'
          : ''
      }`}>
      <span>{tag.name + (tag.count ? ` (${tag.count})` : '')}</span>
    </SmartLink>
  )
}

export default TagItemMini