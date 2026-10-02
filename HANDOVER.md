# NotionNext · Glass 主题 交接文档

> 交接日期：2026-10-02
> 仓库：`Py-Ctrl/NotionNext-Glass`（origin） / `notionnext-org/NotionNext`（upstream）
> 分支：`main`，HEAD = `329e1867`（已推送，与 origin/main 同步）
> 前序工作记录（Trae 会话）：https://share.traecontent.cn/share/YCMM7N6MPV_QCY?enter_from=pc

---

## 1. 项目概览

| 项 | 值 |
| --- | --- |
| 基座 | NotionNext `4.10.10`（Next.js + Notion 数据源） |
| 运行环境 | Node `>=22 <25`，包管理 `yarn@1.22.22`（`packageManager` 字段锁定） |
| 当前主题 | **Glass**，`blog.config.js:9` → `THEME: process.env.NEXT_PUBLIC_THEME \|\| 'Glass'` |
| 主题规模 | `themes/Glass` 103 文件 / 约 19,778 行 |
| 与上游关系 | 领先 `upstream/main` **160** 个提交，落后 0 |
| 起点 | 2026-08-09 `d7aec886 feat: add LiquidGlass theme...`，2026-09-11 `dc62d12f` 由 `liquidglass` 重命名为 `Glass` |
| 主题定位 | 液态玻璃 / iOS 风格，折射效果**全部走 SVG `feDisplacementMap`**（`backdrop-filter: url(#...)`），不依赖 WebGL |

主题代码拆分：`themes/Glass/lib`（55 文件 / 14,195 行）+ 其余（48 文件 / 5,583 行）。
**`themes/Glass/lib` 全库未发现任何引用（静态与动态 import 均已搜索），是早期 WebGL 方案的遗留代码**，见 §11 TODO-3。

---

## 2. 环境与启动

```bash
yarn install --frozen-lockfile   # 或 yarn deps:install
yarn dev                          # next dev，默认 3000
yarn dev -p 3001                  # 交接前的验证环境跑在 3001
yarn build                        # 生产构建（BUILD_MODE=true）
yarn lint && yarn type-check      # 提交前自检
yarn format:check
```

数据源配置：

- 工作区**没有 `.env`**（`.env` 在 `.gitignore` 中），`NOTION_PAGE_ID` 走 `blog.config.js:6-8` 的默认模板 ID。
- 要连自己的 Notion 库：新建 `.env`，设置 `NOTION_PAGE_ID=xxxx`（参考 `.env.example`）。
- 主题切换：`NEXT_PUBLIC_THEME=Glass`；主题内开关见 `themes/Glass/config.js` 与 `conf/themeSwitch.manifest.js`（Glass 条目里有 4 个布尔开关 + 3 个 CSS 变量色板）。

---

## 3. Glass 主题架构

```
themes/Glass/
├── index.js        # 布局装配：LayoutBase / LayoutIndex / LayoutSlug / ... / THEME_CONFIG
│                   #  #theme-glass 根节点、注入 <Style/>、渲染 <BottomTabs/>（249 行）、
│                   #  壁纸 CSS 变量 --glass-bg-image（164-182 行）、卡片鼠标聚光
├── config.js       # LIQUID_* 主题开关（壁纸、菜单、滚动容器、翻页数、排列方式等）
├── style.js        # 1035 行，#theme-glass 命名空间下的玻璃卡片 / 高光 / 蒙版样式
├── components/     # 48 个在用组件
│   ├── BottomTabs.tsx        # 932 行，底部导航栏（SVG 透镜 + 回退两条分支）
│   ├── capsuleLensMap.ts     # 位移图生成：generateCapsuleLensMap / generateDispersedLensMaps
│   ├── useLensBackdrop.js    # 通用 hook：给任意卡片挂折射透镜
│   ├── SiteStatsCard.js      # 右侧栏「最新发布 + 站点统计」
│   ├── SideAreaRight.js      # 右侧栏装配（SiteStatsCard 在 43 行）
│   ├── FloatingMusicPlayer.jsx / MusicPlayer.js
│   └── liquidGlassWallpaper.js / GlassScrollContainer.js / GlassButton.js ...
└── lib/            # ⚠️ 14,195 行 WebGL 渲染器（renderer / shaders / shapes / context.tsx）
                    #    当前无任何引用，疑似遗留，删除前先全局搜索确认
```

### 3.1 折射（透镜）技术方案

核心思路：**用 SVG `feDisplacementMap` 对真实页面背景做位移**，不是模糊贴图。

- `capsuleLensMap.ts`：按元素尺寸/圆角生成位移图（data URL `feImage`），支持 7 抽样色散（`generateDispersedLensMaps`）。
- `useLensBackdrop({ refractionHeight, maxMag, blur, saturate })` → 返回 `{ elRef, style, filterNode }`，调用方三件套挂到任意卡片：
  ```jsx
  const lens = useLensBackdrop({ refractionHeight: 16, maxMag: 32, blur: 0, saturate: 1.5 })
  return <div ref={lens.elRef} className='glass-card' style={lens.style || undefined}>{lens.filterNode}...</div>
  ```
- 能力探测：`CSS.supports('backdrop-filter', 'url(#probe)')`。**仅 Chromium**；Safari / Firefox / 触屏设备（`pointer: coarse`）直接返回 `null`，调用方保留原有 CSS blur 回退。触屏禁用是刻意的——逐帧重跑位移滤镜开销过大。
- 默认参数对齐原版 `liquid-glass-webgl` 的 Scroll Container 卡片（refractionHeight 16dp / amount -32dp / 无模糊 / saturate 1.5），静止即满强度边缘折射。

### 3.2 底栏 `BottomTabs.tsx`（本主题最复杂的文件）

- **几何常量**（150-156 行）：桌面/移动两套尺寸
  `CONTAINER_H 76/64`、`GLASS_H 68/56`、`GLASS_PAD=(CONTAINER_H-GLASS_H)/2`、`TAB_WIDTH 96/76`、`ICON_SIZE 24/20`、`FONT_SIZE 13/11`。端末尺寸用 UA 判定（143 行），避免 DevTools 改窗口宽度造成误判。
- **两条渲染分支**：
  - `svgLens === true`（Chromium）：`774 行`起，SVG 透镜容器 + 指示器 + 文字槽位，`feDisplacementMap` 折射真实页面；选中项文字/图标染 accent 蓝，指示器本身透明，按压时折射/高光/阴影 ramp + ×1.393 放大。
  - 否则（`1037 行`起）：SSR / Safari / Firefox / 不支持 `url()` 的环境，回退成普通 CSS 玻璃条。
- **菜单装配** `menuItems`（161 行）：默认「首页 + 分类/标签/归档（受 `LIQUID_MENU_*` 控制）」，**自定义 `customMenu` 是追加在默认 tab 之后**（早期是整体替换，会把首页/分类/标签/归档全部顶掉，已修）。开启 `CUSTOM_MENU` 时 Menu 取代 `customNav`，否则用 `customNav`。
- **交互**：`handleTabSelect`（707 行）有子菜单则切换面板、否则导航；拖拽 `release` 吸附最近槽位（663 行）；拖拽后用**时间戳** `suppressClickUntilRef = now + 300` 抑制误触 click（布尔标志会遗留并吞掉下一次点击）。
- **动画**：自研 1D 弹簧（`springStep1D` / `springStepScale`），指示器位置与容器缩放各有独立弹簧状态，`applyFrame` 统一写 DOM。

### 3.3 全站壁纸

`themes/Glass/index.js:164-182`：优先级 `LIQUID_BG_IMAGE`（手动 URL）> `LIQUID_BG_FROM_NOTION`（默认 true，取 Notion 站点封面 `siteInfo.pageCover`）> 内置渐变。
`themes/Glass/config.js` 中的 `LIQUID_BG_VEIL`（浅色蒙版，默认 `rgba(255,255,255,0.2)`）与 `LIQUID_BG_VEIL_DARK`。
> 蒙版是白色叠加，值越大照片越灰：0.55 会把整张图洗成中灰，浅色模式 0.2 是实测平衡点。
> 纯色/纯渐变背景**没有细节可折射**，只有文字和卡片边缘能看出位移，想让底栏折射明显要给有纹理的图。

---

## 4. Notion 数据侧约定（Menu / SubMenu）

代码链路：

```
lib/db/notion/getCustomMenu.js:55 getCustomMenu()
  → 收集 type === 'Menu' | 'SubMenu' 且 Published 的行
  → props.customMenu[]（SubMenu 挂到"前面最近的那个 Menu"，75-81 行）
  → BottomTabs.tsx menuItems → tabs[].subMenus
  → 点击/拖到该 tab：handleTabSelect 不导航，改为 setSubMenuOpen(i)
  → renderSubMenu()（738 行）在 fixed 定位渲染玻璃面板
```

在 Notion 里怎么加：

1. 同一个数据库新建一行，`type` 选 **SubMenu**，`status` 填 **Published**。
2. **必须紧挨在父 Menu 行的正下方**——顺序是硬要求，归属逻辑取「前一个 Menu」。
   所以视图**不要按日期 / 标题排序**，顺序来自视图自身的 block 顺序（`getAllPageIds`）。
3. 字段规则同 Menu：
   - `slug` 填某个 Page 的 slug → 自动解析成该页 href；留空回退 `/`。
   - `icon` 填 **FontAwesome 类名**（`fas fa-link`），子项留空不显示图标。
     emoji / 图片 URL 不会渲染（子项图标不走 `getIconPath`）。

已知限制：

- 只支持一层，SubMenu 下不能再挂 SubMenu。
- **孤儿 SubMenu（排在所有 Menu 之前）会被静默丢弃**——取不到父级直接不 push，不报错。
- 父项带子菜单时，点击只展开、不导航；父项本身要能进，得给它一个指向 Page 的 `slug`。

---

## 5. 站点统计（不蒜子）链路

```
conf/analytics.config.js  ANALYTICS_BUSUANZI_ENABLE（默认 true，env: NEXT_PUBLIC_ANALYTICS_BUSUANZI_ENABLE）
        ↓
components/ExternalPlugins.js:555  dynamic(() => import('@/components/Busuanzi'), { ssr:false })
        ↓
components/Busuanzi.js   只在 theme 变化时 busuanzi.fetch() 一次（见下方"坑"）
        ↓
lib/plugins/busuanzi.js  JSONP fetch + lastData 缓存 + subscribe/notify 广播（111-177 行）
        ↓
themes/Glass/components/SiteStatsCard.js:81   useEffect(() => busuanzi.subscribe(setBusuanziData), [])
```

卡片四个格子：

| 格子 | 数据来源 |
| --- | --- |
| 文章数 | `postCount` → 分类计数求和 → `posts.length` → `allPosts.length`（多级兜底，95-106 行） |
| 建站天数 | `SINCE`（`blog.config.js:11`，默认 2023）本地计算 |
| 访问量 | `busuanziData.site_pv`，`ANALYTICS_BUSUANZI_ENABLE` 为 false 时**整个格子不渲染**（不留永久 `--`） |
| 访客数 | `busuanziData.site_uv`，同上 |

关键设计：**订阅制而非 DOM 回填**。原方案是不蒜子脚本按 `.busuanzi_value_*` 类名回填 DOM，SPA 路由切回首页时新挂载的卡片会永远停在 `--`；`subscribe()` 让新组件直接拿到缓存值且不产生额外请求。

---

## 6. 本地验证方法（无头 / 沙箱环境适用）

这套流程在交接前反复使用，接手后照做即可：

1. **不要靠截图定位右侧栏**——`SideAreaRight` 是 `hidden xl:block`，窄视口下不渲染，必须 **DOM 直读**：
   ```js
   document.querySelector('.glass-sidebar')?.innerText
   ```
2. **验证订阅链路**（本机沙箱访问不到外网时）：页面加载后注入真实格式响应
   ```js
   Object.keys(window).filter(k => k.startsWith('BusuanziCallback'))
   // 用返回的第一个 key：
   window[key]({ site_pv: 80783285, site_uv: 57121938, version: 2.4 })
   ```
   再读卡片文本确认数字落位。
3. **单次访问只记一次 PV**：硬加载首页等 5 秒，`BusuanziCallback_*` 的数量应为 **1**（曾为 2）。
4. **网络事实**：`http://busuanzi.ibruce.info/busuanzi?jsonpCallback=...` 带 Referer 直连返回 `{site_uv, page_pv, site_pv}`；浏览器沙箱内可能报 `net::ERR_EMPTY_RESPONSE`，属环境限制，不代表线上故障。
5. **子菜单验证**：点「建站教程」→ 面板出现 3 项；面板开着点另一个父 tab → **一次点击即切换**；点当前 tab → 收起；点面板外 → 收起。
6. 编译自检：`yarn lint` + `yarn type-check`。

---

## 7. 已知坑（踩过并解决的，务必先读）

1. **CSS 优先级压过 Tailwind 定位**（本次最贵的一个坑）
   `themes/Glass/style.js:59-60` → `#theme-glass .glass-card { position: relative }`，
   `id + class` 权重高于 `.fixed` 单类选择器，带 `glass-card` 的元素只要写 `className='fixed ...'` 就会掉回文档流，被挤到页面最底部（子菜单曾实测 `rect.y = 4014`，文档高 4353）。
   **解法：定位走内联 `style={{ position:'fixed' }}`（内联优先级最高），或提高选择器权重。** 新增任何 fixed 浮层都要检查是否带 `glass-card`。

2. **`feImage` data URL 加载后 Chromium 不重跑 `backdrop-filter`**
   换位移图后必须**跨帧**关-开切换（先写 `'none'`，真实绘制过一帧再写回 `url(#id)`）；同一任务内同步切换是无效操作。
   位置：`useLensBackdrop.js:75 起`、`BottomTabs.tsx:346-360`。

3. **`-webkit-backdrop-filter` 与 `backdrop-filter` 必须同时写/同时切**
   Chrome 里两者是同一属性别名，只切其一会导致 `.glass-card` 的 blur 覆盖位移、折射静默失效。

4. **透镜只在 Chromium 生效**，Safari / Firefox / 触屏走 CSS blur 回退；不要在回退分支依赖 `url()`。

5. **`useCallback([])` 捕获首帧几何**：`applyFrame` 必须读 `geoRef.current`，否则按压/路由动画落定后会把指示器写回错误尺寸（`BottomTabs.tsx:131-133`）。

6. **尺寸测量要防抖 120ms**：ResizeObserver 拖窗时每帧触发，位移图会被反复重光栅（`BottomTabs.tsx:220`）。

7. **点击外部关闭 vs. tab 点击的事件次序**：同一次点击里 button `onClick` 先执行、document 监听后执行，若外部点击处理器也清空状态，切换父级 tab 要点两次。
   现方案：`handleClickOutside` 忽略落在 `containerRef`（底栏）内的点击（`BottomTabs.tsx:719-730`）。

8. **拖拽抑制点击用时间戳而非布尔**（`BottomTabs.tsx:663-665`）：拖拽后的 click 可能落在祖先元素上不触发 handler，布尔标志会遗留并吞掉下一次正常点击。

9. **壁纸蒙版别调大**：`LIQUID_BG_VEIL` 0.55 会把照片洗成中灰；浅色模式 0.2 为佳。

10. **不蒜子重复计数**：`components/Busuanzi.js` 曾同时存在 `[]` 与 `[theme]` 两个 effect，首屏发两次请求、`site_pv` 记两遍。现只保留 `[theme]`（theme 初值非空，首屏仍只发一次）。**别再加 `[]` 的 fetch effect。**

---

## 8. 近期提交时间线

| 日期 | 提交 | 内容 |
| --- | --- | --- |
| 08-09 | `d7aec886` / `4169a1d7` | 新增 LiquidGlass 主题并切为默认主题 |
| 09-05~06 | `de17e88b` ~ `f01b7adf` | 底栏指示器透镜系列：去锯齿、满幅折射、色散壳带、静止模糊修复 |
| 09-11 | `dc62d12f` | 主题目录 `liquidglass` → `Glass` |
| 09-13 | `9467ab0c` | 各类卡片加 SVG 折射、修翻页、按钮纯黑、去重搜索框 |
| 09-24 | `28970ff5` / `6ee9b31f` / `33d9fa51` | 壁纸改用 Notion 站点封面；`useLensBackdrop` 跟随目标元素切换；音乐播放器加透镜 |
| 09-25 | `5574a751` | 浅色壁纸蒙版降到 0.2，消除照片发灰 |
| 09-26 | `5cea3c82` | 底栏长按折射对齐原版，指示器 7 抽样色散 + 双弹簧 |
| 09-27 | `a91e37c0` | **站点统计卡片接入不蒜子访问量与访客数** |
| 09-27 | `329e1867` | **子菜单锚定底栏上方，自定义 Menu 改为追加**（当前 HEAD，已推送） |

---

## 9. 当前工作区状态（接手时请先确认）

```bash
$ git status --porcelain -uall
 M components/Busuanzi.js       # 仅 LF/CRLF 行尾差异，内容零变化
 M conf/widget.config.js        # 仅行尾差异
 M lib/plugins/busuanzi.js      # 仅行尾差异
 M package.json                 # ⚠️ 见下
```

- **`package.json` 是 npm 规范化产物，不是功能改动**：`repository.url` 加 `git+`、`author` 被压成一行、多出 `description: "<div align=\"center\">"`、`main: ".eslintrc.js"`、空 `keywords`。
  丢弃：`git checkout -- package.json`；要留就单独提一个 commit。
- 无 stash；`git diff --numstat` 只有 package.json 有实际行数变化。
- `.gitignore` 已忽略：`.env`、`.next/`、`.codex-temp/`、`temp-liquid-glass-src/`。
- 前几次会话提到的 `AGENTS.md`、`temp-shots/`、`temp-verify/`、`temp-goose-liquid-glass.js` **当前工作区已不存在**（从未入库）。

---

## 10. 接手后建议的自检清单

- [ ] `yarn install --frozen-lockfile` → `yarn dev` 能起，首页是 Glass 主题
- [ ] 底栏：点击 / 拖拽切换 tab 正常，指示器弹性动画无卡顿
- [ ] 子菜单：一次点击切换父级、点外部关闭、**面板锚在对应 tab 正上方**（`BottomTabs.tsx:738-769`，内联定位）
- [ ] 右侧栏站点统计：文章数 / 建站天数有值，访问量 / 访客数在不蒜子可达时有值
- [ ] `ANALYTICS_BUSUANZI_ENABLE=false` 时两个统计格子消失而非显示 `--`
- [ ] 硬加载首页 `BusuanziCallback_*` 数量 = 1
- [ ] 切换深浅色、切换主题再切回，玻璃与壁纸表现正常
- [ ] 窄视口（< xl）右侧栏隐藏，底栏与子菜单不溢出视口
- [ ] `yarn lint && yarn type-check` 通过

---

## 11. 遗留 TODO / 后续建议

1. **SubMenu 父级绑定改为显式字段**（优先级最高）
   现在靠「紧跟在父 Menu 之后」的相邻关系归属，视图一改排序菜单就丢，且孤儿被静默丢弃。
   建议改成按 `slug` 前缀或显式父级字段绑定，孤儿降级为顶层 tab。
2. **子菜单面板边界夹紧**：已锚定选中 tab（`bottom = CONTAINER_H + 16 + 8`，水平按 `GLASS_PAD + (i+0.5)*indW - canvasW/2` 偏移），tab 很多或面板较宽时仍可能贴边，可加 `Math.min/max` 夹紧。
3. **评估删除 `themes/Glass/lib`（14,195 行 WebGL 遗留）**
   全库搜索未见 `lib/context|renderer|shaders|shapes|helpers` 的外部引用；删除前再全局搜一次并跑构建确认。
4. **`package.json` 处置**（见 §9）。
5. **Safari / Firefox / 移动端回退样式对齐**：回退分支只保证可用，视觉与 Chromium 分支有差距。
6. **性能观测**：SVG 透镜逐帧位移在低端桌面机上的开销尚未量化（触屏已禁用）。
7. **文档入库**：本文件若要进 VitePress 文档站，可移动到 `docs/user-guide/themes/` 下。

---

## 12. 快速索引

| 要改什么 | 去哪里 |
| --- | --- |
| 默认主题 / Notion 数据源 / 站点基础信息 | `blog.config.js` |
| 主题开关（壁纸、菜单、翻页、排列） | `themes/Glass/config.js` |
| 主题切换器可调项 | `conf/themeSwitch.manifest.js` |
| 玻璃卡片样式 / 定位坑的来源 | `themes/Glass/style.js:59` |
| 底部导航栏、子菜单、指示器动画 | `themes/Glass/components/BottomTabs.tsx` |
| 位移图（折射）生成 | `themes/Glass/components/capsuleLensMap.ts` |
| 给新卡片加折射 | `themes/Glass/components/useLensBackdrop.js` |
| 站点统计卡片 | `themes/Glass/components/SiteStatsCard.js` |
| 不蒜子请求与订阅 | `lib/plugins/busuanzi.js`、`components/Busuanzi.js` |
| 菜单数据装配（Menu/SubMenu） | `lib/db/notion/getCustomMenu.js` |
| 统计类开关 | `conf/analytics.config.js` |
| 布局装配 / 壁纸 | `themes/Glass/index.js` |
