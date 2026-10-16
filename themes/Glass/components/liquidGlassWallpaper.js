/**
 * 玻璃主题的兜底壁纸（无 Notion 封面 / 未配 LIQUID_BG_IMAGE 时使用）
 *
 * ## 为什么这里是写死的暖色而不是 var(--glass-accent-rgb)
 * 本文件在模块加载时就把 SVG 序列化成 data URL 了 —— 那时候还没有 DOM，
 * CSS 变量无从解析。所以兜底壁纸只能用**写死的默认色**，
 * 和 style.js 里 --glass-accent-rgb 的浅色默认值（#b45309 琥珀 700）保持一致。
 * 真实壁纸（Notion 封面）走的是另一条路，见 lib/glassAccent.js。
 *
 * ## 配色
 * 蓝紫已弃用：暖中性（stone）底 + 琥珀渐隐光斑。
 * 蓝紫压在暖调照片上是冲突的，换成同族色玻璃才不显脏。
 */

const buildGradientSVG = (isDarkMode) => {
  const base = isDarkMode
    ? ['#0c0a09', '#1c1917', '#0c0a09']
    : ['#fafaf9', '#f5f5f4', '#fafaf9']

  const spots = isDarkMode
    ? [
        { cx: '20%', cy: '10%', color: '#b45309', opacity: 0.1 },
        { cx: '80%', cy: '20%', color: '#92400e', opacity: 0.08 },
        { cx: '50%', cy: '80%', color: '#78350f', opacity: 0.07 }
      ]
    : [
        { cx: '20%', cy: '10%', color: '#b45309', opacity: 0.12 },
        { cx: '80%', cy: '20%', color: '#c2410c', opacity: 0.09 },
        { cx: '50%', cy: '80%', color: '#92400e', opacity: 0.07 }
      ]

  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='800'>
<defs>
<linearGradient id='b' x1='0' y1='0' x2='1' y2='1'>
<stop offset='0' stop-color='${base[0]}'/>
<stop offset='0.3' stop-color='${base[1]}'/>
<stop offset='0.7' stop-color='${base[2]}'/>
<stop offset='1' stop-color='${base[2]}'/>
</linearGradient>
${spots.map((s, i) => `<radialGradient id='s${i}' cx='${s.cx}' cy='${s.cy}' r='0.55'>
<stop offset='0' stop-color='${s.color}' stop-opacity='${s.opacity}'/>
<stop offset='1' stop-color='${s.color}' stop-opacity='0'/>
</radialGradient>`).join('\n')}
</defs>
<rect width='400' height='800' fill='url(#b)'/>
${spots.map((_, i) => `<rect width='400' height='800' fill='url(#s${i})'/>`).join('\n')}
</svg>`

  return 'data:image/svg+xml,' + encodeURIComponent(svg)
}

const GRADIENT_LIGHT = buildGradientSVG(false)
const GRADIENT_DARK = buildGradientSVG(true)

export const getGradientWallpaper = (isDarkMode) => isDarkMode ? GRADIENT_DARK : GRADIENT_LIGHT

const buildBottomBarSVG = (isDarkMode) => {
  const base = isDarkMode
    ? ['#0c0a09', '#1c1917']
    : ['#fafaf9', '#f5f5f4']

  const spots = isDarkMode
    ? [{ cx: '50%', cy: '60%', color: '#b45309', opacity: 0.08 }]
    : [{ cx: '50%', cy: '60%', color: '#b45309', opacity: 0.1 }]

  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='100'>
<defs>
<linearGradient id='b' x1='0' y1='0' x2='1' y2='1'>
<stop offset='0' stop-color='${base[0]}'/>
<stop offset='1' stop-color='${base[1]}'/>
</linearGradient>
${spots.map((s, i) => `<radialGradient id='s${i}' cx='${s.cx}' cy='${s.cy}' r='0.7'>
<stop offset='0' stop-color='${s.color}' stop-opacity='${s.opacity}'/>
<stop offset='1' stop-color='${s.color}' stop-opacity='0'/>
</radialGradient>`).join('\n')}
</defs>
<rect width='400' height='100' fill='url(#b)'/>
${spots.map((_, i) => `<rect width='400' height='100' fill='url(#s${i})'/>`).join('\n')}
</svg>`

  return 'data:image/svg+xml,' + encodeURIComponent(svg)
}

const BOTTOM_BAR_LIGHT = buildBottomBarSVG(false)
const BOTTOM_BAR_DARK = buildBottomBarSVG(true)

export const getBottomBarWallpaper = (isDarkMode) => isDarkMode ? BOTTOM_BAR_DARK : BOTTOM_BAR_LIGHT
