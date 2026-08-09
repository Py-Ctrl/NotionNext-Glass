import { useGlobal } from '@/lib/global'
import SmartLink from '@/components/SmartLink'
import { siteConfig } from '@/lib/config'

const Logo = (props) => {
  const { locale } = useGlobal()
  const { siteInfo } = props

  return (
    <SmartLink href='/' className='flex items-center space-x-2'>
      <div className='glass-float-btn w-10 h-10'>
        <span className='text-lg font-bold text-indigo-500'>
          {siteInfo?.title?.charAt(0) || 'N'}
        </span>
      </div>
      <span className='text-lg font-semibold text-gray-800 dark:text-gray-200 hidden sm:block'>
        {siteInfo?.title || siteConfig('TITLE')}
      </span>
    </SmartLink>
  )
}

export default Logo