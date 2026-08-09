import { useGlobal } from '@/lib/global'
import SmartLink from '@/components/SmartLink'
import { siteConfig } from '@/lib/config'
import CONFIG from '../config'
import { useRouter } from 'next/router'
import { useEffect, useRef, useState } from 'react'
import SearchInput from './SearchInput'

const BlogListBar = (props) => {
  const { tags, currentTag, categories, currentCategory } = props
  const { locale } = useGlobal()
  const router = useRouter()

  return (
    <div className='glass-card p-4 mb-6'>
      {router.asPath !== '/search' && (
        <SearchInput {...props} />
      )}
    </div>
  )
}

export default BlogListBar