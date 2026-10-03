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

  // ===== 折射（SVG 透镜）=====
  // 触屏端是否启用折射。默认 true —— 移动端也要真折射（不是只有 Blur）。
  // 触屏逐帧位移滤镜开销更大，若在低端机上明显掉帧，把这里改成 false 即整体退回 CSS blur。
  LIQUID_LENS_TOUCH: true,
  // 位移图光栅分辨率倍率：位移场平滑，降采样只是换更粗的采样网格，编码值仍是
  // 「元素 px」单位，feImage 拉伸铺满后视觉无损，光栅像素数按平方下降。
  // 0.5 → 像素数降到 1/4。想更清晰调到 1，想更省调到 0.35。
  LIQUID_LENS_RASTER_SCALE: 0.5,
  // 内部下限位移比例（占 maxMag 的比例）。**默认 0 = 1:1 对齐原版**：
  // 原版 shader 对「离边缘超过 refractionHeight 的内部」直接早退，只有边缘环带折射，
  // 中间完全不动。设成 >0 会把内部切成「指向中心」的径向场 —— 整块向中心轻微放大，
  // 观感更"有料"但**不再是原版行为**（且径向场在中轴会翻转，靠 centerRamp 才平滑归零）。
  // 底栏玻璃本体是另一套（BottomTabs 的 LENS_FLOOR=0.25），原因见那里的注释。
  LIQUID_LENS_FLOOR: 0,

  // ===== 全站背景壁纸（themes/Glass/style.js 里的 #theme-glass background）=====
  // 默认直接拿 Notion 站点封面当全站壁纸（和 Hexo 主题的 banner 一个路子）：
  // 取值优先级 = Notion 数据库 cover > 数据库页面 page_cover > HOME_BANNER_IMAGE。
  // 关掉它才回退到内置渐变壁纸。
  LIQUID_BG_FROM_NOTION: true,
  // 手动指定壁纸 URL，优先级高于 Notion 封面（留空 = 用 Notion 封面）。
  // 注意：透镜折射采样的是这块背景，纯色/纯渐变背景本身没有细节可折射，
  // 只有文字和卡片边缘能看出折射；有纹理的图能让整条底栏的折射更明显。
  LIQUID_BG_IMAGE: process.env.NEXT_PUBLIC_THEME_LIQUID_BG_IMAGE || '',
  // 壁纸蒙版：图片模式下叠在图片之上，压低图片对比度，保证玻璃卡片上的文字仍然可读。
  // 注意这是"白色蒙版"——值越大照片越淡、越像灰底（0.55 时整张图会被洗成中灰），
  // 浅色模式给 0.2 左右既能压住高光又不削平对比度；不想要蒙版就设成 transparent。
  LIQUID_BG_VEIL: process.env.NEXT_PUBLIC_THEME_LIQUID_BG_VEIL || 'rgba(255,255,255,0.2)',
  LIQUID_BG_VEIL_DARK: process.env.NEXT_PUBLIC_THEME_LIQUID_BG_VEIL_DARK || 'rgba(8,8,18,0.6)',

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
