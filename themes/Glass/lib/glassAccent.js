/**
 * Glass 主题强调色 —— 一个值推导出全套色，并可选从壁纸自动取色。
 *
 * ## 为什么是「一个值推导」而不是三个配置
 * 原来 config.js 里有 LIQUID_GLASS_PRIMARY / SECONDARY / ACCENT 三个键，
 * 但没有任何 CSS 消费它们 —— 是死配置。现在收敛成一个
 * LIQUID_GLASS_ACCENT，主色 / hover / 渐变中段 / 渐变末段全部由它推导。
 *
 * ## 为什么强调色存成 "R G B" 空格通道
 * 样式里大量出现 rgb(var(--glass-accent-rgb) / 0.15) 这种带透明度写法，
 * hex 塞不进 rgba() 的通道位；只有空格分隔的三元组可以。
 *
 * ## 壁纸取色的坑（三级回退）
 * 1. 走同源的 /_next/image?url=... —— 同源图片不会污染 canvas，能取像素。
 * 2. 不行就退回原图 + crossOrigin='anonymous' —— 只有对方带 CORS 头才成。
 * 3. 再不行就返回 null，由调用方用兜底色。
 * 静态导出（EXPORT 模式）下 /_next/image 不存在，会直接落到第 2 级。
 */

const HUE_SHIFT = 14

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v))

function hexToHsl (hex) {
  const s = String(hex || '').trim().replace(/^#/, '')
  const full = s.length === 3 ? s.split('').map(c => c + c).join('') : s
  if (!/^[0-9a-f]{6}$/i.test(full)) return null
  const r = parseInt(full.slice(0, 2), 16) / 255
  const g = parseInt(full.slice(2, 4), 16) / 255
  const b = parseInt(full.slice(4, 6), 16) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  let h = 0
  let sat = 0
  if (max !== min) {
    const d = max - min
    sat = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6
    else if (max === g) h = ((b - r) / d + 2) / 6
    else h = ((r - g) / d + 4) / 6
  }
  return { h: h * 360, s: sat, l }
}

function hslToRgbStr (h, s, l) {
  const hue = ((h % 360) + 360) % 360
  const sat = clamp(s, 0, 1)
  const lig = clamp(l, 0, 1)
  const c = (1 - Math.abs(2 * lig - 1)) * sat
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1))
  const m = lig - c / 2
  const seg = Math.floor(hue / 60) % 6
  const table = [
    [c, x, 0], [x, c, 0], [0, c, x],
    [0, x, c], [x, 0, c], [c, 0, x]
  ]
  const [r, g, b] = table[seg]
  return `${Math.round((r + m) * 255)} ${Math.round((g + m) * 255)} ${Math.round((b + m) * 255)}`
}

/**
 * 由一个强调色推导出明/暗两套色。
 * 饱和度与明度都会被夹到可用区间 —— 壁纸取出来的色常常过灰或过暗，
 * 直接当强调色用会导致链接和焦点环在浅底上看不见。
 */
export function deriveAccentVars (hex) {
  const parsed = hexToHsl(hex)
  if (!parsed) return null
  const { h } = parsed
  const hAlt = (h + HUE_SHIFT) % 360
  // 浅色系：压在浅底上，饱和度和明度都要能撑住 4.5:1
  const sl = clamp(parsed.s, 0.34, 0.72)
  const ll = clamp(parsed.l, 0.26, 0.56)
  // 暗色系：提亮，深底上才有存在感
  const sd = clamp(parsed.s - 0.08, 0.3, 0.7)
  const ld = clamp(parsed.l + 0.32, 0.5, 0.72)
  return {
    light: {
      '--glass-accent-light-rgb': hslToRgbStr(h, sl, ll),
      '--glass-accent-strong-light-rgb': hslToRgbStr(h, clamp(sl + 0.04, 0.34, 0.8), ll - 0.1),
      '--glass-accent-alt-light-rgb': hslToRgbStr(hAlt, sl, ll - 0.03),
      '--glass-accent-deep-light-rgb': hslToRgbStr(h, sl * 0.95, ll - 0.2)
    },
    dark: {
      '--glass-accent-dark-rgb': hslToRgbStr(h, sd, ld),
      '--glass-accent-strong-dark-rgb': hslToRgbStr(h, clamp(sd - 0.04, 0.26, 0.7), ld + 0.08),
      '--glass-accent-alt-dark-rgb': hslToRgbStr(hAlt, sd, ld - 0.04),
      '--glass-accent-deep-dark-rgb': hslToRgbStr(h, clamp(sd + 0.06, 0.3, 0.75), ld - 0.14)
    }
  }
}

/**
 * 从壁纸里挑一个有彩色倾向的主色。
 * 做法：缩到 32×32，按色相分 12 个桶，丢掉近黑/近白/近灰的像素
 * （它们不携带色相信息，算进去只会把结果拖向灰色），
 * 再按「饱和度 × 数量」给桶打分取最高。
 */
function pickDominantHex (canvas, ctx) {
  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const buckets = Array.from({ length: 12 }, () => ({ n: 0, r: 0, g: 0, b: 0, score: 0 }))
  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3]
    if (a < 128) continue
    const r = data[i] / 255
    const g = data[i + 1] / 255
    const b = data[i + 2] / 255
    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    const l = (max + min) / 2
    const d = max - min
    if (d < 0.12 || l < 0.1 || l > 0.95) continue // 无彩色 / 近黑 / 近白
    const sat = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    let hue
    if (max === r) hue = ((g - b) / d + (g < b ? 6 : 0)) / 6
    else if (max === g) hue = ((b - r) / d + 2) / 6
    else hue = ((r - g) / d + 4) / 6
    const bucket = buckets[Math.floor(hue * 12) % 12]
    bucket.n += 1
    bucket.r += data[i]
    bucket.g += data[i + 1]
    bucket.b += data[i + 2]
    bucket.score += sat
  }
  const best = buckets.reduce((a, b) => (b.score > a.score ? b : a), buckets[0])
  if (!best || best.n < 8) return null
  const toHex = v => clamp(Math.round(v / best.n), 0, 255).toString(16).padStart(2, '0')
  return `#${toHex(best.r)}${toHex(best.g)}${toHex(best.b)}`
}

/**
 * 取壁纸主色。三级回退，见文件头注释。
 * @returns {Promise<string|null>} hex 或 null
 */
export async function extractAccentFromWallpaper (url) {
  if (typeof document === 'undefined' || !url) return null
  const isExport = process.env.EXPORT === 'true' || process.env.EXPORT === true

  const candidates = []
  if (!isExport) {
    candidates.push(`/_next/image?url=${encodeURIComponent(url)}&w=48&q=60`)
  }
  candidates.push(url)

  for (const src of candidates) {
    try {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.decoding = 'sync'
      const ok = await new Promise(resolve => {
        img.onload = () => resolve(true)
        img.onerror = () => resolve(false)
        img.src = src
      })
      if (!ok) continue

      const canvas = document.createElement('canvas')
      canvas.width = 32
      canvas.height = 32
      const ctx = canvas.getContext('2d', { willReadFrequently: true })
      if (!ctx) return null
      ctx.drawImage(img, 0, 0, 32, 32)
      // 跨域图片没带 CORS 头时这里会抛 —— 正是要捕获的情况
      const hex = pickDominantHex(canvas, ctx)
      if (hex) return hex
    } catch (e) {
      // 继续试下一级
    }
  }
  return null
}

const cache = new Map()

/** 把推导结果写到 DOM 上：浅色落在 #theme-glass，暗色落在 <html>（靠继承）。 */
export function applyGlassAccent (rootEl, vars) {
  if (!rootEl || !vars) return
  for (const [name, value] of Object.entries(vars.light)) {
    rootEl.style.setProperty(name, value)
  }
  const html = document.documentElement
  for (const [name, value] of Object.entries(vars.dark)) {
    html.style.setProperty(name, value)
  }
}

/**
 * 解析最终要用的强调色：config 固定值 > 壁纸取色 > 兜底色。
 * @returns {Promise<string>} hex
 */
export async function resolveGlassAccent ({ accent, auto, fallback, wallpaperUrl }) {
  const fixed = String(accent || '').trim()
  if (fixed) return fixed
  if (!auto || !wallpaperUrl) return String(fallback || '#b45309')
  const key = wallpaperUrl
  if (cache.has(key)) return cache.get(key)
  const hex = await extractAccentFromWallpaper(key)
  const resolved = hex || String(fallback || '#b45309')
  cache.set(key, resolved)
  return resolved
}
