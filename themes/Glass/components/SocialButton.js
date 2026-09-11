import QrCode from '@/components/QrCode'
import { siteConfig } from '@/lib/config'
import { useRef, useState } from 'react'
import { handleEmailClick } from '@/lib/plugins/mailEncrypt'

const SocialButton = () => {
  const CONTACT_GITHUB = siteConfig('CONTACT_GITHUB')
  const CONTACT_TWITTER = siteConfig('CONTACT_TWITTER')
  const CONTACT_TELEGRAM = siteConfig('CONTACT_TELEGRAM')
  const CONTACT_LINKEDIN = siteConfig('CONTACT_LINKEDIN')
  const CONTACT_ORCID = siteConfig('CONTACT_ORCID')
  const CONTACT_WEIBO = siteConfig('CONTACT_WEIBO')
  const CONTACT_INSTAGRAM = siteConfig('CONTACT_INSTAGRAM')
  const CONTACT_EMAIL = siteConfig('CONTACT_EMAIL')
  const ENABLE_RSS = siteConfig('ENABLE_RSS')
  const CONTACT_BILIBILI = siteConfig('CONTACT_BILIBILI')
  const CONTACT_YOUTUBE = siteConfig('CONTACT_YOUTUBE')
  const CONTACT_XIAOHONGSHU = siteConfig('CONTACT_XIAOHONGSHU')
  const CONTACT_ZHISHIXINGQIU = siteConfig('CONTACT_ZHISHIXINGQIU')
  const CONTACT_WEHCHAT_PUBLIC = siteConfig('CONTACT_WEHCHAT_PUBLIC')

  const [qrCodeShow, setQrCodeShow] = useState(false)
  const emailIcon = useRef(null)

  const hasAnyLink = CONTACT_GITHUB || CONTACT_TWITTER || CONTACT_TELEGRAM ||
    CONTACT_LINKEDIN || CONTACT_ORCID || CONTACT_WEIBO || CONTACT_INSTAGRAM ||
    CONTACT_EMAIL || ENABLE_RSS || CONTACT_BILIBILI || CONTACT_YOUTUBE ||
    CONTACT_XIAOHONGSHU || CONTACT_ZHISHIXINGQIU || CONTACT_WEHCHAT_PUBLIC

  if (!hasAnyLink) return null

  const linkClass = 'glass-float-btn !w-9 !h-9 !rounded-full text-gray-600 dark:text-gray-300 hover:!text-indigo-500 dark:hover:!text-indigo-400'

  return (
    <div className='w-full flex justify-center'>
      <div className='flex flex-wrap gap-2 justify-center items-center'>
        {CONTACT_GITHUB && (
          <a target='_blank' rel='noreferrer' title='GitHub' href={CONTACT_GITHUB} className={linkClass}>
            <i className='fab fa-github text-base' />
          </a>
        )}
        {CONTACT_BILIBILI && (
          <a target='_blank' rel='noreferrer' title='BiliBili' href={CONTACT_BILIBILI} className={linkClass}>
            <i className='fab fa-bilibili text-base' />
          </a>
        )}
        {CONTACT_XIAOHONGSHU && (
          <a target='_blank' rel='noreferrer' title='小红书' href={CONTACT_XIAOHONGSHU} className={linkClass}>
            <img className='w-4 h-4' src='/svg/xiaohongshu.svg' alt='小红书' />
          </a>
        )}
        {CONTACT_WEIBO && (
          <a target='_blank' rel='noreferrer' title='微博' href={CONTACT_WEIBO} className={linkClass}>
            <i className='fab fa-weibo text-base' />
          </a>
        )}
        {CONTACT_INSTAGRAM && (
          <a target='_blank' rel='noreferrer' title='Instagram' href={CONTACT_INSTAGRAM} className={linkClass}>
            <i className='fab fa-instagram text-base' />
          </a>
        )}
        {CONTACT_TWITTER && (
          <a target='_blank' rel='noreferrer' title='Twitter' href={CONTACT_TWITTER} className={linkClass}>
            <i className='fab fa-twitter text-base' />
          </a>
        )}
        {CONTACT_YOUTUBE && (
          <a target='_blank' rel='noreferrer' title='YouTube' href={CONTACT_YOUTUBE} className={linkClass}>
            <i className='fab fa-youtube text-base' />
          </a>
        )}
        {CONTACT_TELEGRAM && (
          <a target='_blank' rel='noreferrer' title='Telegram' href={CONTACT_TELEGRAM} className={linkClass}>
            <i className='fab fa-telegram text-base' />
          </a>
        )}
        {CONTACT_LINKEDIN && (
          <a target='_blank' rel='noreferrer' title='LinkedIn' href={CONTACT_LINKEDIN} className={linkClass}>
            <i className='fab fa-linkedin text-base' />
          </a>
        )}
        {CONTACT_ORCID && (
          <a target='_blank' rel='noreferrer' title='ORCID' href={CONTACT_ORCID} className={linkClass}>
            <i className='fab fa-orcid text-base' />
          </a>
        )}
        {CONTACT_ZHISHIXINGQIU && (
          <a target='_blank' rel='noreferrer' title='知识星球' href={CONTACT_ZHISHIXINGQIU} className={linkClass}>
            <img className='w-4 h-4' src='/svg/zhishixingqiu.svg' alt='知识星球' />
          </a>
        )}
        {CONTACT_EMAIL && (
          <a
            onClick={e => handleEmailClick(e, emailIcon, CONTACT_EMAIL)}
            title='邮箱'
            className={`cursor-pointer ${linkClass}`}
            ref={emailIcon}>
            <i className='fas fa-envelope text-base' />
          </a>
        )}
        {ENABLE_RSS && (
          <a target='_blank' rel='noreferrer' title='RSS' href='/rss/feed.xml' className={linkClass}>
            <i className='fas fa-rss text-base' />
          </a>
        )}
        {CONTACT_WEHCHAT_PUBLIC && (
          <div
            className='relative'
            onMouseEnter={() => setQrCodeShow(true)}
            onMouseLeave={() => setQrCodeShow(false)}>
            <button aria-label='微信公众号' className={linkClass}>
              <i className='fab fa-weixin text-base' />
            </button>
            <div
              className={`absolute bottom-10 left-1/2 -translate-x-1/2 transition-all duration-200 z-40 ${
                qrCodeShow ? 'opacity-100 visible' : 'opacity-0 invisible'
              }`}>
              <div className='glass-card p-2 w-28 h-28'>
                {qrCodeShow && <QrCode value={CONTACT_WEHCHAT_PUBLIC} />}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default SocialButton
