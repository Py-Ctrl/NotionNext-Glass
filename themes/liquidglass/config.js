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

  // 是否启用 liquid-glass WebGL 组件（需引入 liquid-glass.js CDN）
  LIQUID_GLASS_WEBGL_ENABLED: true,

  // 玻璃模糊强度
  LIQUID_BLUR_INTENSITY: '16px',

  // 玻璃透明度
  LIQUID_GLASS_OPACITY: '0.65'
}
export default CONFIG