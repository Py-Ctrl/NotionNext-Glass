/* eslint-disable react/no-unknown-property */
import { themeConsoleStyle } from '@/lib/themeConsoleStyle'
import CONFIG from './config'

const Style = () => {
  return <style jsx global>{`

    /* ========== 全局玻璃质感基础 ========== */
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
    }

    .dark #theme-liquidglass {
      --glass-bg: rgba(20, 20, 35, 0.55);
      --glass-border: rgba(255, 255, 255, 0.08);
      --glass-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      color-scheme: dark;
    }

    /* ========== 玻璃卡片 ========== */
    #theme-liquidglass .glass-card {
      background: var(--glass-bg);
      backdrop-filter: blur(var(--glass-blur));
      -webkit-backdrop-filter: blur(var(--glass-blur));
      border: 1px solid var(--glass-border);
      border-radius: var(--glass-radius);
      box-shadow: var(--glass-shadow);
      transition: all 0.3s ease;
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

    /* ========== 玻璃搜索框 ========== */
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

    /* ========== 液态玻璃组件容器 ========== */
    #theme-liquidglass .liquid-glass-container {
      border-radius: 24px;
      overflow: hidden;
      box-shadow: var(--glass-shadow);
    }

    #theme-liquidglass .liquid-glass-container liquid-glass {
      display: block;
      width: 100%;
      height: 100%;
    }

    /* ========== 页面过渡 ========== */
    #theme-liquidglass .glass-transition {
      animation: glassFadeIn 0.5s ease-out;
    }

    @keyframes glassFadeIn {
      from {
        opacity: 0;
        transform: translateY(12px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
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

    ${themeConsoleStyle('liquidglass', CONFIG)}
  `}</style>
}

export { Style }