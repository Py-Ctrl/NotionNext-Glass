import SmartLink from '@/components/SmartLink'

const TagItemMini = ({ tag, selected = false }) => {
  return (
    <SmartLink
      href={`/tag/${encodeURIComponent(tag.name)}`}
      className={`glass-tag inline-block ${
        selected
          ? 'bg-liquid-100 dark:bg-liquid-900/40 border-liquid-300 dark:border-liquid-700 text-liquid-700 dark:text-liquid-400'
          : ''
      }`}>
      <span>{tag.name + (tag.count ? ` (${tag.count})` : '')}</span>
    </SmartLink>
  )
}

export default TagItemMini