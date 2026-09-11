import LazyImage from '@/components/LazyImage'
import SmartLink from '@/components/SmartLink'
import { siteConfig } from '@/lib/config'

const Logo = (props) => {
  const { siteInfo } = props

  return (
    <SmartLink href='/' className='flex items-center space-x-3'>
      <div className='shrink-0 w-10 h-10 rounded-full overflow-hidden ring-2 ring-white/30 dark:ring-white/10'>
        <LazyImage
          priority={true}
          src={siteInfo?.icon}
          className='rounded-full w-full h-full object-cover'
          width={40}
          height={40}
          alt={siteConfig('AUTHOR')}
        />
      </div>
      <span className='text-base font-semibold text-gray-800 dark:text-gray-200 hidden sm:block truncate max-w-[140px]'>
        {siteInfo?.title || siteConfig('TITLE')}
      </span>
    </SmartLink>
  )
}

export default Logo
