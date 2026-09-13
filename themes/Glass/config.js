/**
 * Glass 主题配置
 * 液态玻璃风格的 NotionNext 主题，渲染效果参考
 * martin65536/liquid-glass-webgl（Kyant0/AndroidLiquidGlass 的 WebGL 移植）。
 * 折射采用 SVG feDisplacementMap（backdrop-filter: url()），零 WebGL 开销。
 */
const CONFIG = {

  // 玻璃主题色
  LIQUID_GLASS_PRIMARY: '#6366f1',
  LIQUID_GLASS_SECONDARY: '#8b5cf6',
  LIQUID_GLASS_ACCENT: '#06b6d4',

  // 菜单配置
  LIQUID_MENU_CATEGORY: true,
  LIQUID_MENU_TAG: true,
  LIQUID_MENU_ARCHIVE: true,
  LIQUID_MENU_SEARCH: true,

  // 侧边栏
  LIQUID_RIGHT_BAR: true,

  // 导航类型
  LIQUID_NAV_TYPE: process.env.NEXT_PUBLIC_THEME_LIQUID_NAV_TYPE || 'autoCollapse',

  // 文章列表封面
  LIQUID_POST_LIST_COVER: true,

  // 文章列表预览
  LIQUID_POST_LIST_PREVIEW: true,

  // 推荐文章
  LIQUID_ARTICLE_RECOMMEND_POSTS: true,

  // 玻璃模糊强度
  LIQUID_BLUR_INTENSITY: '16px',

  // 玻璃透明度
  LIQUID_GLASS_OPACITY: '0.65',

  // 翻页模式每页文章数（优先级：Notion 配置 > 此处 > conf/post.config.js）
  // 站点文章较少时把它调小，保证能翻页（例如 12 篇 → 6/页 → 2 页）
  POSTS_PER_PAGE: 6,

  // 文章列表默认排列：'list' 纵向列表 | 'hover' 网格悬停展开（其余卡片模糊）
  POST_LIST_LAYOUT: 'list',

  // 首页滚动容器（玻璃卡片列表，实时折射页面背景）
  LIQUID_SCROLL_CONTAINER: true,

  // 滚动容器高度（px）
  LIQUID_SCROLL_CONTAINER_HEIGHT: 360
}
export default CONFIG
