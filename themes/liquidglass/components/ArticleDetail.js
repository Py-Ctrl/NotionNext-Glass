import { useGlobal } from '@/lib/global'
import SmartLink from '@/components/SmartLink'
import { siteConfig } from '@/lib/config'
import CONFIG from '../config'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import Comment from '@/components/Comment'
import ShareBar from '@/components/ShareBar'
import NotionPage from '@/components/NotionPage'
import WWAds from '@/components/WWAds'
import ArticleCopyright from './ArticleCopyright'
import RecommendPosts from './RecommendPosts'
import BlogAround from './BlogAround'

const ArticleDetail = (props) => {
  const { post, prev, next, recommendPosts } = props
  const { fullWidth } = useGlobal()

  return (
    <div className={`px-2 ${fullWidth ? '' : 'xl:max-w-4xl 2xl:max-w-6xl'}`}>
      {/* 文章标题区 */}
      <div className='glass-card p-6 md:p-10 mb-6'>
        <h1 className='text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100'>
          {post?.title}
        </h1>

        {post?.pageIcon && (
          <div className='mt-2 text-4xl'>{post.pageIcon}</div>
        )}

        <div className='flex flex-wrap items-center gap-3 mt-4 text-sm text-gray-500 dark:text-gray-400'>
          {post?.date?.start_date && (
            <span>
              <i className='far fa-calendar mr-1' />
              {post.date.start_date}
            </span>
          )}
          {post?.category && (
            <SmartLink
              href={`/category/${post.category}`}
              className='glass-link'>
              <i className='fas fa-folder mr-1' />
              {post.category}
            </SmartLink>
          )}
          {post?.tags && (
            <div className='flex flex-wrap gap-1'>
              {post.tags.map(tag => (
                <SmartLink
                  key={tag}
                  href={`/tag/${encodeURIComponent(tag)}`}
                  className='glass-tag text-xs'>
                  {tag}
                </SmartLink>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 广告 */}
      <WWAds orientation='horizontal' className='w-full mb-6' />

      {/* 文章内容 */}
      <div id='article-wrapper' className='glass-card p-4 md:p-8'>
        <NotionPage post={post} />
      </div>

      {/* 版权声明 */}
      <ArticleCopyright post={post} />

      {/* 分享 */}
      <div className='mt-6'>
        <ShareBar post={post} />
      </div>

      {/* 前后文章 */}
      {post?.type === 'Post' && (
        <div className='mt-6'>
          <BlogAround prev={prev} next={next} />
          <RecommendPosts recommendPosts={recommendPosts} />
        </div>
      )}

      {/* 评论区 */}
      <div className='glass-card p-4 md:p-6 mt-6'>
        <Comment frontMatter={post} />
      </div>
    </div>
  )
}

export default ArticleDetail