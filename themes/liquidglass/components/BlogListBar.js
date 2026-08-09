import { useRouter } from 'next/router'
import SearchInput from './SearchInput'

const BlogListBar = (props) => {
  const router = useRouter()

  return (
    <div className='glass-card p-3 sm:p-4 mb-4 sm:mb-6 overflow-hidden'>
      {router.asPath !== '/search' && (
        <SearchInput {...props} />
      )}
    </div>
  )
}

export default BlogListBar
