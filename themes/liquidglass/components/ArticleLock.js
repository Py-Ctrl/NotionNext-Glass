import { useGlobal } from '@/lib/global'
import SmartLink from '@/components/SmartLink'
import CONFIG from '../config'
import { siteConfig } from '@/lib/config'

const ArticleLock = ({ validPassword }) => {
  const { locale } = useGlobal()

  return (
    <div className='glass-card p-8 md:p-12 text-center max-w-md mx-auto mt-20'>
      <div className='text-5xl mb-4'>
        <i className='fas fa-lock text-indigo-400' />
      </div>
      <h2 className='text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4'>
        {locale.COMMON.PASSWORD || '此文章已加密'}
      </h2>
      <p className='text-sm text-gray-500 dark:text-gray-400 mb-6'>
        {locale.COMMON.PASSWORD_TIPS || '请输入密码访问'}
      </p>
      <input
        type='password'
        id='password-input'
        className='glass-search w-full px-4 py-2.5 text-center text-gray-800 dark:text-gray-200 outline-none'
        placeholder='请输入密码'
        onKeyUp={(e) => {
          if (e.keyCode === 13) {
            validPassword(e.target.value)
          }
        }}
      />
      <button
        onClick={() => {
          const input = document.getElementById('password-input')
          if (input) validPassword(input.value)
        }}
        className='glass-btn mt-4 text-indigo-500 dark:text-indigo-400 w-full'>
        <i className='fas fa-unlock mr-2' />
        {locale.COMMON.SUBMIT || '提交'}
      </button>
    </div>
  )
}

export { ArticleLock }