import { useGlobal } from '@/lib/global'
import NotionPage from '@/components/NotionPage'

const Announcement = ({ post }) => {
  const { locale } = useGlobal()
  if (!post) return null

  return (
    <div className='glass-card p-4 mb-4'>
      <div className='text-sm pb-1 px-2 flex items-center gap-2'>
        <i className='fas fa-bullhorn text-indigo-400' />
        <span className='font-medium text-gray-700 dark:text-gray-300'>
          {locale.COMMON.ANNOUNCEMENT}
        </span>
      </div>
      <div id='announcement-content'>
        <NotionPage post={post} />
      </div>
    </div>
  )
}

export default Announcement