# LiquidGlass 主题项目结构与编辑指南

## 项目概述
NotionNext 博客的 LiquidGlass 主题，基于 `martin65536/liquid-glass-webgl` 项目的 WebGL 渲染器实现真正的液态玻璃效果。

## 目录结构

```
themes/liquidglass/
├── index.js                    # 主布局（LayoutBase / LayoutSlug / LayoutSearch 等）
├── style.js                    # 全局样式（styled-jsx），所有 CSS 类定义在此
├── config.js                   # 主题配置项
├── PROJECT_GUIDE.md            # 本文件
│
├── components/                 # 主题组件
│   ├── BottomTabs.tsx          # 底部标签栏（WebGL 液态玻璃，核心组件）
│   ├── ArticleDetail.js        # 文章详情页
│   ├── BlogAround.js           # 上一篇/下一篇导航（liquid-glass-card 样式）
│   ├── BlogPostCard.js         # 文章列表卡片
│   ├── DarkModeButton.js       # 深/浅色切换按钮（liquid-glass-toggle 样式）
│   ├── FloatDarkModeButton.js  # 悬浮版深/浅色切换（包装 DarkModeButton）
│   ├── JumpToTopButton.js      # 回到顶部按钮（liquid-glass-toggle 样式）
│   ├── JumpToBottomButton.js   # 跳到底部按钮（liquid-glass-toggle 样式）
│   ├── TocDrawerButton.js      # 目录按钮（liquid-glass-toggle 样式）
│   ├── GlassButton.js          # CSS 玻璃按钮组件（liquid-glass-btn 样式）
│   ├── MusicPlayer.js          # 音乐播放器（仅桌面端渲染）
│   ├── SideArea.js             # 侧边栏
│   ├── TopNav.js               # 顶部导航（含 Algolia 搜索）
│   ├── SearchInput.js          # 搜索输入框
│   ├── LiquidGlassSearchScript.js # 搜索下拉框 CDN 脚本
│   ├── liquidGlassWallpaper.js # 壁纸生成（渐变/透明/底栏专用）
│   ├── iconMap.js              # 图标类名 → SVG path 映射
│   ├── contact.config.js       # 联系方式配置
│   └── SocialButton.js         # 社交按钮
│
├── lib/                        # WebGL 渲染器核心
│   ├── context.tsx             # LiquidGlassCanvas 组件（连接 React 和 WebGL）
│   ├── helpers.ts              # 玻璃元素工厂函数（makeGlassShape/makeText 等）
│   ├── types.ts                # 类型定义（ThemePalette, GlassElementConfig 等）
│   ├── renderer/               # WebGL 渲染器
│   │   ├── index.ts            # 渲染器主类 LiquidGlassRenderer
│   │   ├── methods-render.ts   # 主渲染逻辑（render/renderBackground/renderNonGlassElement）
│   │   ├── methods-render-glass-pingpong.ts  # 玻璃元素 ping-pong 渲染
│   │   ├── methods-fbo.ts      # FBO 管理（drawCopy/drawCopyToScreen）
│   │   ├── methods-wallpaper.ts # 壁纸纹理加载
│   │   └── ...其他方法文件
│   └── shaders/                # GLSL 着色器
│       ├── scene-bg.ts         # 壁纸/复制/纯色填充着色器
│       ├── element.ts          # 玻璃元素主着色器（折射/模糊/色差）
│       ├── sdf.ts              # SDF 形状定义
│       └── ...其他着色器
```

## 两套玻璃样式体系

### 1. `glass-*` 系列（传统 CSS glassmorphism）
- `glass-card` — 通用玻璃卡片（文章正文、评论区等）
- `glass-btn` — 通用玻璃按钮
- `glass-float-btn` — 圆形悬浮按钮（已弃用，改为 liquid-glass-toggle）
- `glass-tag` — 标签
- `glass-link` — 链接
- `glass-nav` — 导航栏
- `glass-sidebar` — 侧边栏
- `glass-post-item` — 文章列表项
- 定义位置：`style.js` 第 42-310 行

### 2. `liquid-glass-*` 系列（Apple Liquid Glass 风格）
- `liquid-glass-toggle` — 圆形切换按钮（DarkModeButton、JumpToTop/Bottom、TocDrawer）
- `liquid-glass-card` — 卡片按钮（BlogAround 上一篇/下一篇）
- `liquid-glass-btn` — 按钮组件（GlassButton.js，有 surface/blue 两种变体）
- 特点：内外阴影、`saturate(180%)`、`::before` 伪元素高光渐变
- 定义位置：`style.js` 第 621-810 行

## 常见编辑方法

### 修改页面背景渐变
文件：`style.js` 第 9-39 行
- 亮色：`#theme-liquidglass` 的 `background` 属性
- 暗色：`.dark #theme-liquidglass` 的 `background` 属性
- 同时需要更新 `liquidGlassWallpaper.js` 中的 `buildBottomBarSVG()` 和 `buildGradientSVG()` 颜色

### 修改底栏玻璃效果
文件：`components/BottomTabs.tsx`
- `CANVAS_H = 72` — 画布高度
- `CONTAINER_H = 64` — 容器高度
- `GLASS_H = 56` — 玻璃区域高度
- `wallpaperSrc={getBottomBarWallpaper(isDarkMode)}` — 壁纸来源
- `dpr={1.5}` — 渲染精度（最大 2）
- 玻璃参数在 `elements` useMemo 中（refractionAmount, blurRadius, saturation 等）

### 修改底栏壁纸颜色
文件：`components/liquidGlassWallpaper.js`
- `buildBottomBarSVG()` — 底栏专用壁纸（400x100，匹配页面底部渐变）
- `buildGradientSVG()` — 完整渐变壁纸（400x800，匹配整页渐变）
- 亮色 base：`['#ecfeff', '#f0fdf4']`
- 暗色 base：`['#0a1a1f', '#0a0f0a']`

### 修改玻璃按钮样式
文件：`style.js`
- `liquid-glass-toggle`（第 621-689 行）— 圆形按钮
- `liquid-glass-card`（第 692-744 行）— 卡片按钮
- `liquid-glass-btn`（第 747-812 行）— 通用按钮

### 修改文章详情页布局
文件：`components/ArticleDetail.js`
- 文章标题区 → `glass-card`
- 正文区 → `glass-card`
- 版权声明 → `glass-card` + `glass-link`
- 上一篇/下一篇 → `liquid-glass-card`
- 推荐文章 → `BlogPostCard`
- 评论区 → `glass-card`

### 修改深/浅色切换
文件：`components/DarkModeButton.js`
- 使用 `liquid-glass-toggle` 类
- 图标：深色显示 `fa-sun`，浅色显示 `fa-moon`

### WebGL 渲染器关键设置
文件：`lib/renderer/index.ts`
- 第 681-687 行：WebGL context 设置（`alpha: true`, `premultipliedAlpha: true`）
- 壁纸加载：`methods-wallpaper.ts` 的 `loadWallpaper()`
- 渲染管线：`methods-render.ts` 的 `render()` 方法
- 最终 blit：`drawCopyToScreen()`（带 alpha 预乘）

## 关键约束（不可违反）
1. LoadingCover 组件不能使用（路由切换时全屏白/黑屏）
2. MusicPlayer 仅桌面端渲染（`window.innerWidth >= 1024`），防止移动端双重播放
3. `liquid-glass-webgl` 渲染器需要不透明壁纸才能产生折射效果
4. 底栏壁纸颜色必须匹配页面背景底部颜色
5. `customMenu` 的 `subMenus` 必须清洗为 `{name, href, icon}` DTO
6. `getIconPath` 必须处理非字符串输入（数组、对象）
7. `isDarkMode` 必须在组件依赖数组中

## Git 仓库
- 远程：`https://github.com/Py-Ctrl/NotionNext-Glass.git`
- 分支：`main`
- Git 路径：`D:\Git\cmd\git.exe`（需添加到 PATH）
