/* eslint-disable react/no-unknown-property */
import { themeConsoleStyle } from '@/lib/themeConsoleStyle'
import CONFIG from './config'

const Style = () => {
  return <style jsx global>{`

    /* ========== 全局背景 — 玻璃效果可见的关键 ========== */
    #theme-liquidglass {
      --glass-bg: rgba(255, 255, 255, 0.25);
      --glass-bg-dark: rgba(15, 15, 25, 0.55);
      --glass-border: rgba(255, 255, 255, 0.18);
      --glass-border-dark: rgba(255, 255, 255, 0.08);
      --glass-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
      --glass-shadow-dark: 0 8px 32px rgba(0, 0, 0, 0.3);
      --glass-blur: 16px;
      --glass-radius: 16px;
      color-scheme: light;
      min-height: 100vh;
      background:
        radial-gradient(ellipse 80% 60% at 20% 10%, rgba(99, 102, 241, 0.15), transparent),
        radial-gradient(ellipse 70% 50% at 80% 20%, rgba(139, 92, 246, 0.12), transparent),
        radial-gradient(ellipse 60% 40% at 50% 80%, rgba(6, 182, 212, 0.1), transparent),
        linear-gradient(135deg, #eef2ff 0%, #faf5ff 30%, #ecfeff 70%, #f0fdf4 100%);
      background-attachment: fixed;
    }

    .dark #theme-liquidglass {
      --glass-bg: rgba(20, 20, 35, 0.55);
      --glass-border: rgba(255, 255, 255, 0.08);
      --glass-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      color-scheme: dark;
      background:
        radial-gradient(ellipse 80% 60% at 20% 10%, rgba(99, 102, 241, 0.12), transparent),
        radial-gradient(ellipse 70% 50% at 80% 20%, rgba(139, 92, 246, 0.1), transparent),
        radial-gradient(ellipse 60% 40% at 50% 80%, rgba(6, 182, 212, 0.08), transparent),
        linear-gradient(135deg, #0a0a1a 0%, #0f0f23 30%, #0a1a1f 70%, #0a0f0a 100%);
      background-attachment: fixed;
    }

    /* ========== 玻璃卡片 ========== */
    #theme-liquidglass .glass-card {
      position: relative;
      overflow: hidden;
      background: var(--glass-bg);
      backdrop-filter: blur(var(--glass-blur));
      -webkit-backdrop-filter: blur(var(--glass-blur));
      border: 1px solid var(--glass-border);
      border-radius: var(--glass-radius);
      box-shadow: var(--glass-shadow);
      transition: all 0.3s ease;
    }

    /* ========== 卡片交互光晕（Win10 21H2 任务栏风格） ========== */
    /* Algolia 搜索弹窗 */
    #theme-liquidglass .algolia-glass-card {
      position: relative;
      overflow: hidden;
    }

    /* 边框光晕：跟随鼠标，只在边框区域显示 */
    #theme-liquidglass .glass-card::before,
    #theme-liquidglass .glass-post-item::before,
    #theme-liquidglass .glass-sidebar::before,
    #theme-liquidglass .algolia-glass-card::before {
      content: '';
      position: absolute;
      inset: 0;
      padding: 1px;
      border-radius: inherit;
      background: radial-gradient(
        200px circle at var(--glow-x, -1000px) var(--glow-y, -1000px),
        rgba(99, 102, 241, 0.9),
        rgba(139, 92, 246, 0.5),
        transparent 60%
      );
      -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
      -webkit-mask-composite: xor;
      mask-composite: exclude;
      pointer-events: none;
      z-index: 1;
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    /* 内部聚光：跟随鼠标，卡片内部淡光 */
    #theme-liquidglass .glass-card::after,
    #theme-liquidglass .glass-post-item::after,
    #theme-liquidglass .glass-sidebar::after,
    #theme-liquidglass .algolia-glass-card::after {
      content: '';
      position: absolute;
      inset: 0;
      background: radial-gradient(
        600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%),
        rgba(99, 102, 241, 0.1),
        transparent 40%
      );
      opacity: 0;
      transition: opacity 0.3s ease;
      pointer-events: none;
      z-index: 0;
      border-radius: inherit;
    }

    /* 仅在支持 hover 的设备（非触摸）上启用鼠标聚光 */
    @media (hover: hover) {
      #theme-liquidglass .glass-card:hover::before,
      #theme-liquidglass .glass-post-item:hover::before,
      #theme-liquidglass .glass-sidebar:hover::before,
      #theme-liquidglass .algolia-glass-card:hover::before {
        opacity: 1;
      }

      #theme-liquidglass .glass-card:hover::after,
      #theme-liquidglass .glass-post-item:hover::after,
      #theme-liquidglass .glass-sidebar:hover::after,
      #theme-liquidglass .algolia-glass-card:hover::after {
        opacity: 1;
      }
    }

    /* 触摸设备完全禁用 ::before/::after 伪元素，节省资源 */
    @media (pointer: coarse) {
      #theme-liquidglass .glass-card::before,
      #theme-liquidglass .glass-post-item::before,
      #theme-liquidglass .glass-sidebar::before,
      #theme-liquidglass .algolia-glass-card::before,
      #theme-liquidglass .glass-card::after,
      #theme-liquidglass .glass-post-item::after,
      #theme-liquidglass .glass-sidebar::after,
      #theme-liquidglass .algolia-glass-card::after {
        display: none;
      }
    }

    /* 暗色模式 */
    .dark #theme-liquidglass .glass-card::before,
    .dark #theme-liquidglass .glass-post-item::before,
    .dark #theme-liquidglass .glass-sidebar::before,
    .dark #theme-liquidglass .algolia-glass-card::before {
      background: radial-gradient(
        200px circle at var(--glow-x, -1000px) var(--glow-y, -1000px),
        rgba(129, 140, 248, 0.9),
        rgba(167, 139, 250, 0.5),
        transparent 60%
      );
    }

    .dark #theme-liquidglass .glass-card::after,
    .dark #theme-liquidglass .glass-post-item::after,
    .dark #theme-liquidglass .glass-sidebar::after,
    .dark #theme-liquidglass .algolia-glass-card::after {
      background: radial-gradient(
        600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%),
        rgba(129, 140, 248, 0.12),
        transparent 40%
      );
    }

    .dark #theme-liquidglass .glass-card {
      background: var(--glass-bg-dark);
      border-color: var(--glass-border-dark);
      box-shadow: var(--glass-shadow-dark);
    }

    #theme-liquidglass .glass-card:hover {
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.12);
      border-color: rgba(255, 255, 255, 0.3);
    }

    .dark #theme-liquidglass .glass-card:hover {
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
      border-color: rgba(255, 255, 255, 0.15);
    }

    /* ========== 玻璃导航栏 ========== */
    #theme-liquidglass .glass-nav {
      background: var(--glass-bg);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border-bottom: 1px solid var(--glass-border);
      transition: all 0.3s ease;
    }

    .dark #theme-liquidglass .glass-nav {
      background: rgba(15, 15, 25, 0.7);
      border-bottom-color: rgba(255, 255, 255, 0.06);
    }

    /* ========== 玻璃按钮 ========== */
    #theme-liquidglass .glass-btn {
      background: var(--glass-bg);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      border: 1px solid var(--glass-border);
      border-radius: 12px;
      padding: 8px 16px;
      cursor: pointer;
      transition: all 0.25s ease;
      font-size: 14px;
    }

    #theme-liquidglass .glass-btn:hover {
      background: rgba(255, 255, 255, 0.35);
      border-color: rgba(255, 255, 255, 0.35);
      transform: translateY(-1px);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
    }

    .dark #theme-liquidglass .glass-btn {
      background: rgba(255, 255, 255, 0.06);
      border-color: rgba(255, 255, 255, 0.08);
      color: #e5e7eb;
    }

    .dark #theme-liquidglass .glass-btn:hover {
      background: rgba(255, 255, 255, 0.12);
      border-color: rgba(255, 255, 255, 0.15);
    }

    /* ========== 玻璃搜索框（CSS 回退） ========== */
    #theme-liquidglass .glass-search {
      background: var(--glass-bg);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid var(--glass-border);
      border-radius: 14px;
      transition: all 0.3s ease;
    }

    #theme-liquidglass .glass-search:focus-within {
      border-color: #6366f1;
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
    }

    /* ========== 玻璃标签 ========== */
    #theme-liquidglass .glass-tag {
      background: var(--glass-bg);
      backdrop-filter: blur(6px);
      -webkit-backdrop-filter: blur(6px);
      border: 1px solid var(--glass-border);
      border-radius: 8px;
      padding: 4px 10px;
      font-size: 12px;
      transition: all 0.2s ease;
      cursor: pointer;
    }

    #theme-liquidglass .glass-tag:hover {
      background: rgba(99, 102, 241, 0.15);
      border-color: rgba(99, 102, 241, 0.3);
      color: #6366f1;
    }

    /* ========== 文章列表项玻璃效果 ========== */
    #theme-liquidglass .glass-post-item {
      position: relative;
      background: var(--glass-bg);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid var(--glass-border);
      border-radius: var(--glass-radius);
      box-shadow: var(--glass-shadow);
      transition: all 0.35s ease;
      overflow: hidden;
    }

    .dark #theme-liquidglass .glass-post-item {
      background: var(--glass-bg-dark);
      border-color: var(--glass-border-dark);
      box-shadow: var(--glass-shadow-dark);
    }

    #theme-liquidglass .glass-post-item:hover {
      transform: translateY(-3px);
      box-shadow: 0 16px 48px rgba(0, 0, 0, 0.15);
      border-color: rgba(255, 255, 255, 0.3);
    }

    .dark #theme-liquidglass .glass-post-item:hover {
      box-shadow: 0 16px 48px rgba(0, 0, 0, 0.45);
      border-color: rgba(255, 255, 255, 0.12);
    }

    /* ========== 侧边栏玻璃 ========== */
    #theme-liquidglass .glass-sidebar {
      position: relative;
      overflow: hidden;
      background: var(--glass-bg);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid var(--glass-border);
      border-radius: var(--glass-radius);
      box-shadow: var(--glass-shadow);
    }

    .dark #theme-liquidglass .glass-sidebar {
      background: var(--glass-bg-dark);
      border-color: var(--glass-border-dark);
    }

    /* ========== 底部栏玻璃 ========== */
    #theme-liquidglass .glass-footer {
      background: var(--glass-bg);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border-top: 1px solid var(--glass-border);
    }

    .dark #theme-liquidglass .glass-footer {
      background: rgba(15, 15, 25, 0.6);
      border-top-color: rgba(255, 255, 255, 0.06);
    }

    /* ========== 悬浮按钮玻璃 ========== */
    #theme-liquidglass .glass-float-btn {
      background: var(--glass-bg);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid var(--glass-border);
      border-radius: 50%;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.3s ease;
      box-shadow: var(--glass-shadow);
    }

    #theme-liquidglass .glass-float-btn:hover {
      transform: scale(1.1);
      border-color: rgba(255, 255, 255, 0.35);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
    }

    .dark #theme-liquidglass .glass-float-btn {
      background: rgba(30, 30, 50, 0.6);
    }

    /* ========== 链接样式 ========== */
    #theme-liquidglass .glass-link {
      color: #6366f1;
      text-decoration: none;
      transition: color 0.2s ease;
    }

    #theme-liquidglass .glass-link:hover {
      color: #4f46e5;
    }

    .dark #theme-liquidglass .glass-link {
      color: #818cf8;
    }

    .dark #theme-liquidglass .glass-link:hover {
      color: #a5b4fc;
    }

    /* ========== 滚动条 ========== */
    #theme-liquidglass ::-webkit-scrollbar {
      width: 6px;
    }

    #theme-liquidglass ::-webkit-scrollbar-track {
      background: transparent;
    }

    #theme-liquidglass ::-webkit-scrollbar-thumb {
      background: rgba(99, 102, 241, 0.2);
      border-radius: 3px;
    }

    #theme-liquidglass ::-webkit-scrollbar-thumb:hover {
      background: rgba(99, 102, 241, 0.4);
    }

    /* ========== 选中文字 ========== */
    #theme-liquidglass ::selection {
      background: rgba(99, 102, 241, 0.2);
      color: inherit;
    }

    /* ========== 旧版 glassmorphism 兼容 ========== */
    #theme-liquidglass .glassmorphism {
      background: var(--glass-bg);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid var(--glass-border);
      border-radius: 12px;
    }

    /* ========== liquid-glass-search 容器 ========== */
    #theme-liquidglass .liquid-glass-search-wrapper {
      border-radius: 20px;
      overflow: hidden;
      box-shadow: var(--glass-shadow);
      position: relative;
    }

    #theme-liquidglass .liquid-glass-search-wrapper liquid-glass-search {
      display: block;
      width: 100%;
    }

    /* ========== Live2D 宠物挂件 ========== */
    #theme-liquidglass #live2d {
      max-width: 100%;
      height: auto;
    }

    #theme-liquidglass .animate-spin-slow {
      animation: spin-slow 8s linear infinite;
    }

    @keyframes spin-slow {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    /* 隐藏全局 APlayer，使用主题自研悬浮播放器替代 */
    .aplayer.aplayer-fixed,
    .aplayer {
      display: none !important;
    }

    /* ========== Algolia 搜索弹窗美化 ========== */

    /* 弹窗主体 */
    #theme-liquidglass #search-wrapper > div:first-child {
      background: rgba(255, 255, 255, 0.72) !important;
      backdrop-filter: blur(28px) saturate(180%) !important;
      -webkit-backdrop-filter: blur(28px) saturate(180%) !important;
      border: 1px solid rgba(255, 255, 255, 0.35) !important;
      border-radius: 20px !important;
      box-shadow: 0 24px 64px rgba(0, 0, 0, 0.12), inset 0 0 0 1px rgba(255, 255, 255, 0.1) !important;
    }

    .dark #theme-liquidglass #search-wrapper > div:first-child {
      background: rgba(18, 18, 32, 0.78) !important;
      border-color: rgba(255, 255, 255, 0.1) !important;
      box-shadow: 0 24px 64px rgba(0, 0, 0, 0.45), inset 0 0 0 1px rgba(255, 255, 255, 0.05) !important;
    }

    /* 标题渐变 */
    #theme-liquidglass #search-wrapper .text-2xl {
      background: linear-gradient(135deg, #6366f1, #8b5cf6, #06b6d4) !important;
      -webkit-background-clip: text !important;
      -webkit-text-fill-color: transparent !important;
      background-clip: text !important;
    }

    /* 关闭按钮 */
    #theme-liquidglass #search-wrapper .fa-xmark {
      transition: all 0.25s ease !important;
    }

    #theme-liquidglass #search-wrapper .fa-xmark:hover {
      transform: rotate(90deg) scale(1.15) !important;
      color: #6366f1 !important;
    }

    /* 搜索输入框 */
    #theme-liquidglass #search-wrapper input[type='text'] {
      background: rgba(255, 255, 255, 0.5) !important;
      border: 1px solid rgba(255, 255, 255, 0.3) !important;
      border-radius: 12px !important;
      color: #1f2937 !important;
      transition: all 0.3s ease !important;
    }

    #theme-liquidglass #search-wrapper input[type='text']::placeholder {
      color: rgba(107, 114, 128, 0.6) !important;
    }

    #theme-liquidglass #search-wrapper input[type='text']:focus {
      border-color: #6366f1 !important;
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15) !important;
      background: rgba(255, 255, 255, 0.7) !important;
      outline: none !important;
    }

    .dark #theme-liquidglass #search-wrapper input[type='text'] {
      background: rgba(255, 255, 255, 0.06) !important;
      border-color: rgba(255, 255, 255, 0.1) !important;
      color: #e5e7eb !important;
    }

    .dark #theme-liquidglass #search-wrapper input[type='text']::placeholder {
      color: rgba(156, 163, 175, 0.5) !important;
    }

    .dark #theme-liquidglass #search-wrapper input[type='text']:focus {
      border-color: #818cf8 !important;
      box-shadow: 0 0 0 3px rgba(129, 140, 248, 0.15) !important;
      background: rgba(255, 255, 255, 0.1) !important;
    }

    /* 标签组 */
    #theme-liquidglass #search-wrapper #tags-group > a > div {
      background: rgba(255, 255, 255, 0.3) !important;
      backdrop-filter: blur(8px) !important;
      -webkit-backdrop-filter: blur(8px) !important;
      border: 1px solid rgba(255, 255, 255, 0.2) !important;
      border-radius: 10px !important;
      transition: all 0.2s ease !important;
    }

    #theme-liquidglass #search-wrapper #tags-group > a > div:hover {
      background: rgba(99, 102, 241, 0.18) !important;
      border-color: rgba(99, 102, 241, 0.4) !important;
      color: #6366f1 !important;
      transform: scale(1.08) !important;
    }

    .dark #theme-liquidglass #search-wrapper #tags-group > a > div {
      background: rgba(255, 255, 255, 0.05) !important;
      border-color: rgba(255, 255, 255, 0.08) !important;
      color: #d1d5db !important;
    }

    .dark #theme-liquidglass #search-wrapper #tags-group > a > div:hover {
      background: rgba(129, 140, 248, 0.15) !important;
      border-color: rgba(129, 140, 248, 0.3) !important;
      color: #a5b4fc !important;
    }

    /* 搜索结果项 */
    #theme-liquidglass #search-wrapper ul li {
      background: transparent !important;
      border: 1px solid transparent !important;
      transition: all 0.2s ease !important;
    }

    #theme-liquidglass #search-wrapper ul li:hover {
      background: rgba(99, 102, 241, 0.08) !important;
      border-color: rgba(99, 102, 241, 0.2) !important;
      transform: translateX(4px) !important;
    }

    #theme-liquidglass #search-wrapper ul li.bg-blue-600,
    .dark #theme-liquidglass #search-wrapper ul li.bg-blue-600 {
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.92), rgba(139, 92, 246, 0.92)) !important;
      border-color: rgba(99, 102, 241, 0.5) !important;
      box-shadow: 0 4px 16px rgba(99, 102, 241, 0.3) !important;
    }

    .dark #theme-liquidglass #search-wrapper ul li:hover {
      background: rgba(129, 140, 248, 0.1) !important;
      border-color: rgba(129, 140, 248, 0.2) !important;
    }

    /* 分页按钮 */
    #theme-liquidglass #search-wrapper .cursor-pointer.w-6 {
      background: rgba(255, 255, 255, 0.2) !important;
      backdrop-filter: blur(8px) !important;
      border: 1px solid rgba(255, 255, 255, 0.15) !important;
      border-radius: 8px !important;
      transition: all 0.2s ease !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
    }

    #theme-liquidglass #search-wrapper .cursor-pointer.w-6:hover {
      background: rgba(99, 102, 241, 0.15) !important;
      border-color: rgba(99, 102, 241, 0.3) !important;
    }

    #theme-liquidglass #search-wrapper .cursor-pointer.w-6.font-bold {
      background: linear-gradient(135deg, #6366f1, #8b5cf6) !important;
      border-color: rgba(99, 102, 241, 0.5) !important;
      color: white !important;
      box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3) !important;
    }

    .dark #theme-liquidglass #search-wrapper .cursor-pointer.w-6 {
      background: rgba(255, 255, 255, 0.05) !important;
      border-color: rgba(255, 255, 255, 0.08) !important;
      color: #d1d5db !important;
    }

    .dark #theme-liquidglass #search-wrapper .cursor-pointer.w-6.font-bold {
      background: linear-gradient(135deg, #818cf8, #a78bfa) !important;
      color: white !important;
    }

    /* 遮罩层 */
    #theme-liquidglass #search-wrapper > .glassmorphism {
      background: rgba(10, 10, 20, 0.25) !important;
      backdrop-filter: blur(8px) !important;
      -webkit-backdrop-filter: blur(8px) !important;
      border: none !important;
      border-radius: 0 !important;
    }

    /* 底部信息栏 */
    #theme-liquidglass #search-wrapper .fa-algolia {
      color: #6366f1 !important;
    }

    .dark #theme-liquidglass #search-wrapper .fa-algolia {
      color: #818cf8 !important;
    }

    /* ========== 移动端响应式 ========== */
    @media (max-width: 640px) {
      #theme-liquidglass {
        --glass-blur: 10px;
        --glass-radius: 12px;
      }

      #theme-liquidglass .glass-card {
        border-radius: 12px;
      }

      #theme-liquidglass .glass-post-item {
        border-radius: 12px;
      }

      #theme-liquidglass .glass-sidebar {
        border-radius: 12px;
      }

      #theme-liquidglass .glass-nav {
        padding: 0.5rem 0.75rem;
      }

      #theme-liquidglass .glass-btn {
        padding: 6px 12px;
        font-size: 13px;
      }

      #theme-liquidglass .glass-float-btn {
        width: 36px;
        height: 36px;
      }

      #theme-liquidglass .liquid-glass-search-wrapper {
        border-radius: 14px;
      }

      /* ponytail: 移动端禁用 background-attachment:fixed（iOS Safari 严重掉帧元凶） */
      #theme-liquidglass,
      .dark #theme-liquidglass {
        background-attachment: scroll !important;
      }
    }

    /* ========== 平板适配 ========== */
    @media (min-width: 641px) and (max-width: 1023px) {
      #theme-liquidglass .glass-card {
        border-radius: 14px;
      }
    }

    /* ========== 大屏适配 ========== */
    @media (min-width: 1280px) {
      #theme-liquidglass {
        --glass-blur: 20px;
        --glass-radius: 20px;
      }
    }

    /* ========== 减少动画偏好 ========== */
    @media (prefers-reduced-motion: reduce) {
      #theme-liquidglass * {
        animation-duration: 0.01ms !important;
        transition-duration: 0.01ms !important;
      }
    }

    /* ========== Liquid Glass 切换按钮 ========== */
    #theme-liquidglass .liquid-glass-toggle {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      border: 1px solid rgba(255, 255, 255, 0.25);
      background: rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(16px) saturate(180%);
      -webkit-backdrop-filter: blur(16px) saturate(180%);
      box-shadow:
        0 4px 16px rgba(0, 0, 0, 0.08),
        inset 0 1px 1px rgba(255, 255, 255, 0.3),
        inset 0 -1px 1px rgba(0, 0, 0, 0.05);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;
    }

    #theme-liquidglass .liquid-glass-toggle::before {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.3) 0%, transparent 50%, rgba(255, 255, 255, 0.1) 100%);
      border-radius: 50%;
      pointer-events: none;
    }

    #theme-liquidglass .liquid-glass-toggle:hover {
      transform: scale(1.08);
      box-shadow:
        0 8px 24px rgba(99, 102, 241, 0.15),
        inset 0 1px 1px rgba(255, 255, 255, 0.4),
        inset 0 -1px 1px rgba(0, 0, 0, 0.08);
      border-color: rgba(99, 102, 241, 0.3);
    }

    #theme-liquidglass .liquid-glass-toggle:active {
      transform: scale(0.95);
    }

    #theme-liquidglass .liquid-glass-toggle-inner {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      position: relative;
      z-index: 1;
    }

    .dark #theme-liquidglass .liquid-glass-toggle {
      background: rgba(30, 30, 50, 0.5);
      border-color: rgba(255, 255, 255, 0.1);
      box-shadow:
        0 4px 16px rgba(0, 0, 0, 0.3),
        inset 0 1px 1px rgba(255, 255, 255, 0.08),
        inset 0 -1px 1px rgba(0, 0, 0, 0.2);
    }

    .dark #theme-liquidglass .liquid-glass-toggle::before {
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, transparent 50%, rgba(255, 255, 255, 0.03) 100%);
    }

    .dark #theme-liquidglass .liquid-glass-toggle:hover {
      box-shadow:
        0 8px 24px rgba(129, 140, 248, 0.2),
        inset 0 1px 1px rgba(255, 255, 255, 0.12),
        inset 0 -1px 1px rgba(0, 0, 0, 0.25);
      border-color: rgba(129, 140, 248, 0.25);
    }

    /* ========== Liquid Glass 卡片按钮（文章导航等） ========== */
    #theme-liquidglass .liquid-glass-card {
      display: block;
      padding: 12px 16px;
      border-radius: 16px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      background: rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(16px) saturate(180%);
      -webkit-backdrop-filter: blur(16px) saturate(180%);
      box-shadow:
        0 4px 16px rgba(0, 0, 0, 0.06),
        inset 0 1px 1px rgba(255, 255, 255, 0.25);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;
      text-decoration: none;
    }

    #theme-liquidglass .liquid-glass-card::before {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, transparent 40%, transparent 60%, rgba(255, 255, 255, 0.05) 100%);
      border-radius: inherit;
      pointer-events: none;
      opacity: 0.8;
    }

    #theme-liquidglass .liquid-glass-card:hover {
      transform: translateY(-2px);
      box-shadow:
        0 12px 32px rgba(99, 102, 241, 0.12),
        inset 0 1px 1px rgba(255, 255, 255, 0.35);
      border-color: rgba(99, 102, 241, 0.25);
    }

    .dark #theme-liquidglass .liquid-glass-card {
      background: rgba(25, 25, 40, 0.5);
      border-color: rgba(255, 255, 255, 0.08);
      box-shadow:
        0 4px 16px rgba(0, 0, 0, 0.25),
        inset 0 1px 1px rgba(255, 255, 255, 0.05);
    }

    .dark #theme-liquidglass .liquid-glass-card::before {
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, transparent 40%, transparent 60%, rgba(255, 255, 255, 0.02) 100%);
    }

    .dark #theme-liquidglass .liquid-glass-card:hover {
      box-shadow:
        0 12px 32px rgba(129, 140, 248, 0.15),
        inset 0 1px 1px rgba(255, 255, 255, 0.08);
      border-color: rgba(129, 140, 248, 0.2);
    }

    /* ========== Liquid Glass 按钮（阅读更多等） ========== */
    #theme-liquidglass .liquid-glass-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 16px;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;
      border: 1px solid rgba(255, 255, 255, 0.2);
      backdrop-filter: blur(12px) saturate(180%);
      -webkit-backdrop-filter: blur(12px) saturate(180%);
    }

    #theme-liquidglass .liquid-glass-btn::before {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, transparent 50%, rgba(255, 255, 255, 0.05) 100%);
      border-radius: inherit;
      pointer-events: none;
    }

    #theme-liquidglass .liquid-glass-btn-surface {
      background: rgba(255, 255, 255, 0.15);
      color: #374151;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06), inset 0 1px 1px rgba(255, 255, 255, 0.25);
    }

    #theme-liquidglass .liquid-glass-btn-blue {
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.35), rgba(139, 92, 246, 0.35));
      color: #4338ca;
      border-color: rgba(99, 102, 241, 0.3);
      backdrop-filter: blur(16px) saturate(180%);
      -webkit-backdrop-filter: blur(16px) saturate(180%);
      box-shadow:
        0 4px 16px rgba(99, 102, 241, 0.15),
        inset 0 1px 1px rgba(255, 255, 255, 0.4),
        inset 0 -1px 1px rgba(0, 0, 0, 0.05);
    }

    #theme-liquidglass .liquid-glass-btn:hover {
      transform: translateY(-1px) scale(1.02);
    }

    #theme-liquidglass .liquid-glass-btn-surface:hover {
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1), inset 0 1px 1px rgba(255, 255, 255, 0.35);
      border-color: rgba(99, 102, 241, 0.25);
    }

    #theme-liquidglass .liquid-glass-btn-blue:hover {
      box-shadow:
        0 8px 24px rgba(99, 102, 241, 0.25),
        inset 0 1px 1px rgba(255, 255, 255, 0.5),
        inset 0 -1px 1px rgba(0, 0, 0, 0.08);
      border-color: rgba(99, 102, 241, 0.4);
    }

    .dark #theme-liquidglass .liquid-glass-btn-surface {
      background: rgba(25, 25, 40, 0.5);
      color: #d1d5db;
      border-color: rgba(255, 255, 255, 0.08);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25), inset 0 1px 1px rgba(255, 255, 255, 0.05);
    }

    .dark #theme-liquidglass .liquid-glass-btn-blue {
      background: linear-gradient(135deg, rgba(129, 140, 248, 0.35), rgba(167, 139, 250, 0.35));
      color: #c7d2fe;
      border-color: rgba(129, 140, 248, 0.25);
      backdrop-filter: blur(16px) saturate(180%);
      -webkit-backdrop-filter: blur(16px) saturate(180%);
      box-shadow:
        0 4px 16px rgba(129, 140, 248, 0.15),
        inset 0 1px 1px rgba(255, 255, 255, 0.15),
        inset 0 -1px 1px rgba(0, 0, 0, 0.15);
    }

    .dark #theme-liquidglass .liquid-glass-btn::before {
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.06) 0%, transparent 50%, rgba(255, 255, 255, 0.02) 100%);
    }

    /* ========== Liquid Glass 分享按钮 ========== */
    #theme-liquidglass .liquid-glass-share button {
      background: rgba(255, 255, 255, 0.12) !important;
      backdrop-filter: blur(14px) saturate(180%);
      -webkit-backdrop-filter: blur(14px) saturate(180%);
      border: 1px solid rgba(255, 255, 255, 0.22) !important;
      box-shadow:
        0 2px 10px rgba(0, 0, 0, 0.06),
        inset 0 1px 1px rgba(255, 255, 255, 0.35),
        inset 0 -1px 1px rgba(0, 0, 0, 0.04);
      position: relative;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      overflow: visible !important;
    }

    #theme-liquidglass .liquid-glass-share button::before {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.28) 0%, transparent 50%, rgba(255, 255, 255, 0.08) 100%);
      border-radius: 50%;
      pointer-events: none;
    }

    #theme-liquidglass .liquid-glass-share button i {
      color: #6b7280 !important;
      position: relative;
      z-index: 1;
    }

    /* 覆盖 CSDN/掘金内联背景色 */
    #theme-liquidglass .liquid-glass-share button > div[style*='background'] {
      background: transparent !important;
    }

    /* 微信二维码弹窗不受玻璃效果影响 */
    #theme-liquidglass .liquid-glass-share button > div.absolute,
    #theme-liquidglass .liquid-glass-share button #pop {
      background: white !important;
      backdrop-filter: none !important;
      -webkit-backdrop-filter: none !important;
      border: none !important;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15) !important;
    }

    #theme-liquidglass .liquid-glass-share button:hover {
      transform: scale(1.12);
      background: rgba(255, 255, 255, 0.2) !important;
      box-shadow:
        0 4px 18px rgba(99, 102, 241, 0.12),
        inset 0 1px 1px rgba(255, 255, 255, 0.45),
        inset 0 -1px 1px rgba(0, 0, 0, 0.06);
      border-color: rgba(99, 102, 241, 0.28) !important;
    }

    #theme-liquidglass .liquid-glass-share button:hover i {
      color: #4f46e5 !important;
    }

    #theme-liquidglass .liquid-glass-share button:active {
      transform: scale(0.95);
    }

    .dark #theme-liquidglass .liquid-glass-share button {
      background: rgba(30, 30, 50, 0.4) !important;
      border-color: rgba(255, 255, 255, 0.08) !important;
      box-shadow:
        0 2px 10px rgba(0, 0, 0, 0.25),
        inset 0 1px 1px rgba(255, 255, 255, 0.06),
        inset 0 -1px 1px rgba(0, 0, 0, 0.18);
    }

    .dark #theme-liquidglass .liquid-glass-share button::before {
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.06) 0%, transparent 50%, rgba(255, 255, 255, 0.02) 100%);
    }

    .dark #theme-liquidglass .liquid-glass-share button i {
      color: #d1d5db !important;
    }

    .dark #theme-liquidglass .liquid-glass-share button:hover {
      background: rgba(50, 50, 80, 0.5) !important;
      box-shadow:
        0 4px 18px rgba(129, 140, 248, 0.18),
        inset 0 1px 1px rgba(255, 255, 255, 0.1),
        inset 0 -1px 1px rgba(0, 0, 0, 0.22);
      border-color: rgba(129, 140, 248, 0.22) !important;
    }

    .dark #theme-liquidglass .liquid-glass-share button:hover i {
      color: #a5b4fc !important;
    }

    ${themeConsoleStyle('liquidglass', CONFIG)}
  `}</style>
}

export { Style }
