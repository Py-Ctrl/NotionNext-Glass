# Glass 主题 · SVG 透镜性能优化方案

> 2026-10-02 · 针对 `backdrop-filter: url(#feDisplacementMap)` 折射链的开销治理
> 前置阅读：`HANDOVER.md` §3.1、§7
> 原则：**先测量再改**，所有改动都要能一键回退（保留 `SVG_LENS_ENABLED` 与回退分支）

---

## 0.5 实现状态（2026-10-02 落地）

### 已实现

| 项 | 落点 | 做了什么 |
| --- | --- | --- |
| **拖拽 rAF 合并** | `BottomTabs.tsx` `move` | `pointermove` 不再直接调 `applyFrame`，改为写入 `pendingX` + 每帧至多一次 `requestAnimationFrame` 落地。120/240Hz 设备上一帧可触发多次 pointermove，原实现会把开销成倍放大 |
| **applyFrame 写入去重**（P0-6 扩展） | `BottomTabs.tsx` `frameCacheRef` | `left/top/width/height/borderRadius/boxShadow/translateX` + 7 张 `feImage` 尺寸 + `feDisplacementMap` scale 全部「值变了才写」。**拖动期 progress 已 ramp 到 1、几何恒定 → 这些写入整段为零**，省掉每帧样式失效与 backdrop 采样区重算 |
| **Q弹速度注入** | `BottomTabs.tsx` `move`/`release` | 拖动中用一阶低通估计指针速度（px/s），松手时作为位置弹簧初速度注入（限幅 `tabW*6`）。ζ=0.5 欠阻尼 → 快速拖拽时指示器「甩出去再弹回来」。原先 `followIndicator` 每次都把 `pv` 清零，速度被丢掉，只能从静止起弹 |
| **拖拽形变 squash & stretch**（原版 `DampedDragAnimation` / `LiquidToggle.kt` layerBlock） | `BottomTabs.tsx` | 补齐原版那两行：`velocity = 平滑速度 / 50`，`scaleX /= 1 - clamp(velocity*0.75, ±0.2)`、`scaleY *= 1 - clamp(velocity*0.25, ±0.2)`；X / Y 各用**独立欠阻尼弹簧**（ζ=0.6 / ζ=0.7, k=250），速度本身先过一层 ζ=0.5 / k=300 的弹簧滤掉指针抖动。快速拖拽时指示器**被拉长、垂直收窄**，松手后随速度归零弹回。几何仍走 width/height（不能用 `transform: scale()`，见下方注意事项）。实测：pressed `132.5×94.7` → 拖拽中 `151.5×90.7`（X +14.3% / Y −4.2%，且 velX:velY = 2.98 ≈ 0.75/0.25）→ 落定回 ×1.0 |
| **设备分级**（P0-1，口径已修正） | `BottomTabs.tsx` `lensDeviceOk()` / `useLensBackdrop.js` | 只拦 `prefers-reduced-motion` / `deviceMemory<=2` / `hardwareConcurrency<=2`。**触屏默认不拦** —— 移动端要的是真折射，不是只有 Blur（由 `LIQUID_LENS_TOUCH` 控制，默认 `true`）。原 P0-1 建议「触屏一律关」已否决：那正是「移动端大部分折射只有 Blur」的成因 |
| **卡片位移图降采样** | `useLensBackdrop.js` `LIQUID_LENS_RASTER_SCALE=0.5` | 卡片此前落到默认 `1`（白付 4 倍光栅 + `feImage` 采样成本）；`0.5` → 像素数 1/4，位移场平滑故视觉无损 |
| **玻璃按钮去透镜** | `GlassButton.js` | 按钮几乎总嵌在带 `backdrop-filter` 的卡片里 → 祖先成为 backdrop root，内层折射**必然失效**；挂着的 `url()` 还把 CSS `blur()` 顶掉。改为纯 CSS：`blur(12px) saturate(180%)` + `::before` 边缘高光 + `transition` 动画（对齐 Apple 的做法：按钮这一级模糊够用） |
| **容器位移图降采样**（P0-4） | `BottomTabs.tsx` `LENS_MAP_RASTER_SCALE=0.5` | 光栅像素 ↓75%，PNG 编码与 `feImage` 采样都更便宜 |
| **卡片可见性门控**（P0-3） | `useLensBackdrop.js` `IntersectionObserver` | 进视口（提前 200px）才挂 `url(#...)`，离视口置 `none`。实测首页 13 张卡片中滚出视口的 4 张透镜**全部摘除**（`outViewWithUrl: 0`），同时存活透镜从 ~11 降到 6 |
| **尺寸测量防抖**（P1-3 的一半） | `useLensBackdrop.js` | ResizeObserver 120ms 防抖，与底栏口径一致；首测仍立即执行避免首屏空窗 |

> **与参考实现的差异（有意保留）**：原版 `DampedDragAnimation` 的**位置**是临界阻尼 `spring(1f, 1000f)`（不过冲），"弹"全部来自 scaleX / scaleY 两条欠阻尼弹簧 + 速度形变。本实现的位置弹簧仍是 ζ=0.5，且松手时额外注入指针速度 —— 位置也会过冲，Q弹更明显。若要 1:1 复刻：把位置那步换成临界阻尼，并去掉 `animateIndicatorTo(x, v0)` 的 `v0`。
>
> 参考实现：`themes/Glass/lib/renderer/methods-animation.ts`（五条弹簧的循环）、`methods-render-glass-transform.ts:99-111`（形变公式）、`helpers.ts:412`（`DampedDragAnimation` 说明）。

### 未实现（按收益排序）1. **P0-2 滚动期降级为纯 CSS** —— 收益最大的一条，仍是空白。当前滚动时底栏容器透镜与视口内卡片透镜会逐帧重跑。建议下一步做：`#wrapper` scroll（passive + rAF 节流）→ 滚动中把容器切 `blur(1.4px) saturate(1.35)`，停稳 150ms 后走跨帧 repaint 舞步切回 `url(#lens)`。
2. **P0-5 色散 7 → 3 抽样** —— 按压期图元 27 → 11。可在「拖动中」用 3 抽样、静止按压用 7 抽样，兼顾手感与成本。
3. P1-1 按压几何档位化 / P1-2 data URL → Blob URL / P1-5 按压才升采样。
4. P2 分级开关（`LIQUID_LENS_LEVEL`）。

### 回退开关一览

| 开关 | 位置 | 作用 |
| --- | --- | --- |
| `SVG_LENS_ENABLED` | `BottomTabs.tsx` | `false` → 整个 SVG 透镜底栏退回 CSS 玻璃分支 |
| `LIQUID_LENS_TOUCH` | `themes/Glass/config.js` | 触屏是否启用折射（底栏 + 卡片共用），**默认 `true`**；低端机设 `false` 退回 CSS blur |
| `LIQUID_LENS_RASTER_SCALE` | `themes/Glass/config.js` | 卡片位移图光栅倍率，默认 `0.5` |
| `LENS_MAP_RASTER_SCALE` | `BottomTabs.tsx` | 底栏容器位移图光栅倍率（`0.5`） |
| `LENS_LOW_END_MEMORY` / `LENS_LOW_END_CORES` | `BottomTabs.tsx` | 设备分级阈值 |
| `useLensBackdrop({ floor })` | `useLensBackdrop.js` | 折射强度（内部位移下限，默认 0.25） |

> **不要回退的结论**：折射是这个主题的核心观感，**不牺牲折射换性能**。WebGL 版本（`themes/Glass/lib`）没有实时折射，不作为替代方案，代码原样保留。降级为纯 CSS 只适用于**按钮**这一级。

---

## 0. 现状诊断：钱花在哪

### A. 常驻成本（页面静止/滚动时就在花）

| # | 问题 | 证据 |
| --- | --- | --- |
| A1 | 底栏玻璃底板**永久挂** `backdropFilter: url(#lensFilterId)`，滤镜链 4 图元（`feImage` + `feDisplacementMap` + `feGaussianBlur(1.4)` + `feColorMatrix(1.35)`）。**backdrop-filter 的失效条件 = 元素背后任何一次重绘**，所以滚动、hover 过渡、AOS 入场、壁纸动画每帧都会让它整条重跑 | `BottomTabs.tsx:940`、`846-865` |
| A2 | 首页同时存活的透镜约 **11 个**：6 张列表卡（`POSTS_PER_PAGE: 6`）+ 左右侧栏 + 站点统计 2 张 + 底栏。滚出视口的卡片**照样跑**——全主题 0 处 `IntersectionObserver` | `BlogPostCard.js:20/36-40`、`SideAreaLeft.js:19`、`SideAreaRight.js:18`、`SiteStatsCard.js:32/76` |
| A3 | **触屏 Chromium 也开透镜**：`svgLens` 只测 `CSS.supports('backdrop-filter','url(#probe)')`，没有 `pointer: coarse` / 低端设备判定；而 `useLensBackdrop` 是排除触屏的，两边不一致 → 移动端底栏逐帧跑位移 | `BottomTabs.tsx:247-257` vs `useLensBackdrop.js:36` |
| A4 | 容器位移图**没开降采样**：`generateCapsuleLensMap(canvasW, CONTAINER_H, ...)` 只传 5 个参数，`rasterScale` 落到默认 1（600×76 ≈ 45.6k 像素 + PNG 编码）；指示器那边已经是 0.5 | `BottomTabs.tsx:263-266` vs `53` |
| A5 | `useLensBackdrop` 的 `size` 变化**无防抖**，窗口拖动时每帧改宽 → 每次重建位移图 + 跑 50ms/100ms repaint 舞步；每张卡各跑各的 timer 链 | `useLensBackdrop.js:47-64`、`85-97` |

### B. 交互期峰值成本（按压 / 拖动）

| # | 问题 | 证据 |
| --- | --- | --- |
| B1 | 指示器色散链 **27 个图元**（7 `feImage` + 7 `feDisplacementMap` + 7 `feColorMatrix` + 6 `feComposite`），按压全程挂载 | `BottomTabs.tsx:877-927` |
| B2 | `applyFrame` 每帧写 `left/top/width/height/borderRadius` → **每帧强制 layout + 重采样 backdrop**。不能简单换 `transform: scale()`——Chromium 对带 transform 缩放的 backdrop-filter 按缩放前尺寸裁剪采样区 | `BottomTabs.tsx:447-459`、注释 `448-449` |
| B3 | 同帧再改 7 个 `feImage` 的 `width/height` → 7 张位移图逐帧重采样（属性写无粒度节流） | `BottomTabs.tsx:470-475` |
| B4 | 指示器几何每帧变 → backdrop 采样区变 → 整条 27 图元链每帧从头跑 | 同上 |

### C. 已经做对的（**不要回退**）

- 指示器滤镜静止即摘（`syncIndFilter`，`345-357`、`533`）——静止不跑色散链
- 色散图懒加载 + `requestIdleCallback` 空闲预热（`288-343`）
- 位移图模块级 LRU 缓存 32 条（`capsuleLensMap.ts:36-53`）
- 弹簧 loop idle 即停（`505-509`），无常驻 rAF
- `setVisualIdx` 只在跨槽时 setState（`559-564`），拖动不触发 React re-render
- 底栏尺寸测量 120ms 防抖（`220-232`）
- `rasterScale` 注释已确认"位移场平滑，降采样视觉无损"（`capsuleLensMap.ts:26-28`）

---

## 1. 测量（先做，作为验收标准）

1. **DevTools → Rendering → Paint flashing + Layer borders**
   - 基线：静止首页应基本不闪；滚动时底栏与卡片区域逐帧闪（= A1/A2 的实证）。
   - 验收：改造后**滚动期间透镜区域不应再逐帧闪**。
2. **Performance 面板录 5s 首页滚动**（先关 DevTools 自身的 paint flashing）
   - 指标：P95 frame time < 16ms；`Paint`/`Layout` 占比下降 ≥ 30%。
   - 注意当前每帧 `applyFrame` 的 layout 只在按压/拖动出现，滚动期重点看 `Paint`。
3. **按住底栏 2s**（长按 ramp 期间）：不应出现 > 50ms 的 long task。
4. **三档基线**：桌面 4 核 / DevTools CPU 4× throttling / 移动端 Chromium（真机或 DevTools 设备模拟）。
5. 建议加 FPS HUD：`NEXT_PUBLIC_GLASS_PERF_HUD=1` 才渲染，算法可直接借鉴闲置的 `themes/Glass/lib/renderer/perf-monitor.ts`。

---

## 2. P0 —— 低风险，一天内可上

| # | 改动 | 位置 | 预期收益 |
| --- | --- | --- | --- |
| **P0-1** | **能力探测补触屏/低端判定**：`svgLens` 增加 `pointer: coarse`、`deviceMemory <= 4`、`hardwareConcurrency <= 4`、`prefers-reduced-motion: reduce` 任一命中即 `false` | `BottomTabs.tsx:247-257` | 移动端直接走已有回退分支，零 SVG 透镜；与 `useLensBackdrop` 口径对齐。**改动最小、收益确定** |
| **P0-2** | **滚动期间降级为纯 CSS**：监听 `#wrapper` scroll（passive + rAF 节流），滚动中把容器玻璃切 `blur(1.4px) saturate(1.35)`，滚动停止 150ms 后走跨帧 repaint 舞步切回 `url(#lens)` | `BottomTabs.tsx:934-946` + 新增 scroll gate | **单项收益最大**：滚动帧不再跑 `feImage` + 位移采样。视觉上滚动时柔焦、停稳后折射细节出现，阅读场景（大多数时间静止）几乎无感 |
| **P0-3** | **卡片透镜可见性门控**：`useLensBackdrop` 加 `IntersectionObserver`（rootMargin 200px），进视口才挂 `url(#...)`，离视口立即置 `none`（回挂时走已有 repaint 舞步） | `useLensBackdrop.js` | 同时存活的透镜从 ~11 降到 2-4；视口外零开销。底栏不受影响 |
| **P0-4** | **容器位移图降采样**：`generateCapsuleLensMap(..., LENS_FLOOR, 0.5)` 补第 7 参 | `BottomTabs.tsx:263-266` | 光栅像素 ↓75%，PNG 编码与 `feImage` 采样都更便宜；注释已背书视觉无损 |
| **P0-5** | **色散抽样 7 → 3**：`DISP_TAPS` 抽 `f ∈ {1, 0, -1}`，权重按"每通道和为 1"重算；或提成 `IND_DISPERSION_TAPS` 配置项便于回退 | `BottomTabs.tsx:42-50` | 按压期图元 27 → 11（-59%）。小尺寸指示器上 3 抽样与 7 抽样的视觉差很小 |
| **P0-6** | **`feImage` 尺寸写入加粒度**：只在 `Math.round` 后的值变化时才 `setAttribute` | `BottomTabs.tsx:470-475` | 消除按压期无意义的属性失效（放大过程尺寸是连续变化的，仍会写，但静止/微抖时不写） |

> P0-1 + P0-4 是纯配置级改动，建议先上，半小时可完成并立刻复测。

---

## 3. P1 —— 2-3 天，每条都要复测视觉

| # | 改动 | 说明 |
| --- | --- | --- |
| **P1-1** | **按压几何档位化**：位移图按 3 个放大档（1.0 / 1.2 / 1.393）预生成，按压期只切 `href` + `translateX`，`width/height` 保持恒定 | 消除每帧 layout。前提：先验证"transform 缩放裁剪采样区"的 Chromium 问题是否只影响 `scale` 不影响 `translate`——现有代码本来就在用 `translateX` 移动指示器，说明 translate 是安全的 |
| **P1-2** | **data URL → Blob URL**：`canvas.toBlob` + `URL.createObjectURL` 替代 `toDataURL` | `capsuleLensMap.ts:79`。省 base64 编解码；缓存需存 blob 并在 LRU 淘汰时 `revokeObjectURL` |
| **P1-3** | **resize 防抖对齐 + repaint 舞步统一调度**：`useLensBackdrop` 的 size 更新加 120ms 防抖（与底栏一致），并把散落各处的 timer 链收敛成一个调度器 | `useLensBackdrop.js:47-64`、`85-97`；`BottomTabs.tsx:393-423`。避免 resize 时 N 张卡各自重跑舞步 |
| **P1-4** | **静止态滤镜链瘦身实验**：`feGaussianBlur(1.4)` 在 backdrop 上不便宜，试拆成"下层 CSS `backdrop-filter: blur(1.4px)` + 上层 `url(#lens)` 只留 2 图元" | ⚠️ 两层会各自采样一次 backdrop，**必须实测**是净省还是净亏。作为实验项，不默认开 |
| **P1-5** | **按压才升采样**：静止态用 0.5 rasterScale 的图，首次按压换 1.0 的图（两套 key 进 LRU 后零成本） | 静止观感不变，按压峰值更清晰 |

---

## 4. P2 —— 结构性选择（P0/P1 测完再决定）

1. **CSS-only 伪折射档位**：`blur + saturate + brightness` + 边缘 `inset box-shadow` 假装位移。
   成本降一个量级（纯 GPU blur），全浏览器一致、触屏可开。
   **建议做成设备分级的最低档**，配合 P0-1 使用，而不是一刀切替换。
2. **分级配置开关**：在 `themes/Glass/config.js` 加 `LIQUID_LENS_LEVEL: 'full' | 'bar-only' | 'off'`
   - `full`：现状（所有卡片 + 底栏）
   - `bar-only`：只有底栏折射，卡片退回 CSS blur（卡片位移在滚动时视觉收益最低）
   - `off`：全 CSS
   让站长按设备/偏好自行选择，避免"性能 vs 观感"的二选一写死在代码里。
3. **WebGL 自绘底栏**（`themes/Glass/lib` 那 14,195 行的原始路线）：需要把背景与文字作为纹理自己渲染，与 React 文字层冲突、复杂度极高。除非 P0/P1 后仍不达标，否则**不推荐**——那份代码当前也无任何引用。
4. **边缘环带分片**：折射实际只在 18px 环带（`LENS_REFRACTION_H`），可拆成 4 条边各自挂小 `url(#)`，采样面积 ↓ 约 55%。但元素数翻 4 倍、圆角处要重叠，复杂度收益比不高，列为备选。

---

## 5. 建议落地顺序

```
① 测量基线（半天）        →  记录 P95 frame、Paint 占比、按压 long task
② P0-1 + P0-4（半小时）   →  移动端关透镜 + 降采样，立刻复测
③ P0-2 + P0-3（1 天）     →  滚动降级 + 可见性门控，这是收益主体
④ 复测 + 对比数据         →  若已达目标，P0-5/P0-6 可选
⑤ P1 按测量结果逐条上      →  每条单独 commit，便于二分回退
⑥ 仍不达标再谈 P2 分级/降档
```

---

## 6. 回退与风险清单

- 所有改动都必须能在 `SVG_LENS_ENABLED = false`（`BottomTabs.tsx:20`）下整体降级到现有回退分支，该分支已验证可用。
- **P0-2 的风险**：滚动/停止切换瞬间可能出现折射"跳出"感——跨帧 repaint 舞步（`'none'` → 真实绘制一帧 → 写回 `url()`）必须走全，否则位移永久为零（见 `HANDOVER.md` §7-2）。
- **P0-3 的风险**：离视口摘滤镜、回挂时若舞步没跑完就滚动，会短暂看到无折射的卡片——用 `IntersectionObserver` 提前 200px 预挂可缓解。
- **P0-5 的风险**：色散权重必须保证"每通道和 = 1"且 alpha 行取 1（否则整块发黑，见 `BottomTabs.tsx:909-913` 的实测记录）。
- 视觉回归检查点：浅色/深色壁纸各一张、底栏长按 2s、拖拽切 tab、翻页后卡片边缘、窄视口。
