// @ts-nocheck
'use client'

/**
 * 生成圆角矩形透镜的位移图（feDisplacementMap 的 in2 输入），返回 PNG data URL。
 *
 * 编码方式：R/G 通道存归一化偏移向量
 *   channel = 0.5 + 0.5 * offset / norm
 * 配合 filter 的 scale = 2 * norm，最终位移 = scale * (channel - 0.5) = offset（像素）。
 *
 * 位移场（原版 RoundedRectRefractionWithDispersionShaderString）：
 *   - 边缘处最强（maxMag），方向取边界内法线（= 负的 SDF 梯度；原版
 *     refractionAmount 为负值，所以 offset 指向内侧）；
 *   - 向内侧按原版 circleMap(x) = 1 - sqrt(1 - x²) 剖面平滑衰减，到 refractionHeight
 *     处归零（斜率为 0），不留硬边接缝；
 *   - 内部保留 floor 比例的下限位移，方向切到「指向中心」的径向场：
 *     内法线场在中轴上会整体翻转 180°，一旦加下限就会在正中留下一条镜像接缝
 *     （内容被切开），径向场只在正中心有奇点，用中心斜坡平滑归零即可。
 *     floor = 0 时保持纯内法线方向（1:1 对齐原版）。
 *
 * 色散（dispersion，原版 chromaticAberration）见 generateDispersedLensMaps。
 *
 * 性能：
 *   - 位移图是纯函数产物（只跟几何/参数有关），模块级 LRU 缓存跨组件挂载、
 *     路由切换、同尺寸卡片复用，避免重复光栅；
 *   - rasterScale 可按更低分辨率光栅（feImage 会拉伸铺满元素）：位移场本身平滑，
 *     降采样只是把场在更粗的网格上采样，编码值仍是「元素 px」单位，视觉无损，
 *     而光栅像素数按平方下降。
 *
 * 注意：feImage 引用 data URL 是异步加载的，Chromium 加载完成后不会自动
 * 重跑 backdrop-filter —— 挂载后必须强制重绘（backdrop-filter 关-开切换），
 * 否则位移图不生效（见 BottomTabs / useLensBackdrop 里的 repaint effect）。
 */

// 位移图缓存：LRU（Map 保持插入序，命中后移到末尾，超限淘汰最旧的）
const MAP_CACHE = new Map()
const MAP_CACHE_MAX = 32

function cacheGet(key) {
  const hit = MAP_CACHE.get(key)
  if (hit === undefined) return undefined
  MAP_CACHE.delete(key)
  MAP_CACHE.set(key, hit)
  return hit
}

function cacheSet(key, value) {
  if (MAP_CACHE.size >= MAP_CACHE_MAX) {
    MAP_CACHE.delete(MAP_CACHE.keys().next().value)
  }
  MAP_CACHE.set(key, value)
  return value
}

function encodeChannel(offset, norm) {
  return Math.max(0, Math.min(255, Math.round(255 * (0.5 + (0.5 * offset) / norm))))
}

function rasterMap(W, H, sample) {
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) return ''
  const img = ctx.createImageData(W, H)
  const data = img.data
  const out = [0, 0, 0]
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      sample(x, y, out)
      const i = (y * W + x) * 4
      data[i] = out[0]
      data[i + 1] = out[1]
      data[i + 2] = 0
      data[i + 3] = 255
    }
  }
  ctx.putImageData(img, 0, 0)
  return canvas.toDataURL('image/png')
}

/**
 * 位移场闭包。坐标一律用「元素 px」，与光栅分辨率无关（降采样只改采样网格）。
 * out = [ox, oy, I0]，I0 = (cx*cy)/(hx*hy) 即原版 dispersionIntensity（不含色散系数）。
 */
function makeField(w, h, radius, refractionHeight, maxMag, floor) {
  const hx = w / 2
  const hy = h / 2
  const r = Math.max(0, Math.min(radius, Math.min(hx, hy)))
  // 核心盒：圆角矩形向内缩 r 后的直边区域（胶囊时退化为线段）
  const coreX = hx - r
  const coreY = hy - r
  const refH = Math.max(0.5, refractionHeight)
  const fl = Math.max(0, Math.min(0.95, floor))
  // 中心斜坡半径：径向位移在正中心必须平滑归零，否则 floor 会让正中一小圈
  // 内容镜像翻转（看上去是「中间一个不明物体」）
  const centerRamp = Math.max(8, Math.min(hx, hy) * 0.5)

  return function field(dx, dy, out) {
    let nx = 0
    let ny = 0
    let edgeDist = 0

    // 最近核心盒点（clamp 到 [-core, core]）
    const qx = Math.max(-coreX, Math.min(coreX, dx))
    const qy = Math.max(-coreY, Math.min(coreY, dy))

    if (qx !== dx || qy !== dy) {
      // 边带（直边或圆角弧）：边界点 = q + r * normalize(p - q)
      const ux = dx - qx
      const uy = dy - qy
      const u = Math.sqrt(ux * ux + uy * uy) || 1e-6
      edgeDist = r - u
      nx = -ux / u
      ny = -uy / u
    } else {
      // 中心区：最近的是四条直边，法线为轴向
      const dL = dx + hx
      const dR = hx - dx
      const dT = dy + hy
      const dB = hy - dy
      edgeDist = Math.min(dL, dR, dT, dB)
      if (edgeDist === dL) nx = 1
      else if (edgeDist === dR) nx = -1
      else if (edgeDist === dT) ny = 1
      else ny = -1
    }

    // 原版剖面：x = 1 - edgeDist/refractionHeight（1 = 边缘 → 0 = 作用域内边界）
    // profile = circleMap(x)：边缘处 1、内边界处 0 且斜率为 0
    const px = Math.max(0, 1 - edgeDist / refH)
    const profile = 1 - Math.sqrt(Math.max(0, 1 - px * px))
    const mag = maxMag * (fl + (1 - fl) * profile)

    let ux = nx
    let uy = ny
    if (fl > 0) {
      // 有下限位移时方向切到径向（见文件头说明）
      const rho0 = Math.sqrt(dx * dx + dy * dy)
      if (rho0 > 1e-3) {
        ux = profile * nx + (1 - profile) * (-dx / rho0)
        uy = profile * ny + (1 - profile) * (-dy / rho0)
        const len = Math.sqrt(ux * ux + uy * uy)
        if (len > 1e-6) {
          ux /= len
          uy /= len
        } else {
          ux = 0
          uy = 0
        }
      }
    }

    // 中心斜坡：位移在正中心平滑归零
    const rho = Math.sqrt(dx * dx + dy * dy)
    let ramp = 1
    if (rho < centerRamp) {
      const t = rho / centerRamp
      ramp = t * t * (3 - 2 * t)
    }

    out[0] = ux * mag * ramp
    out[1] = uy * mag * ramp
    out[2] = (dx * dy) / (hx * hy)
  }
}

export function generateRoundedRectLensMap(
  w,
  h,
  radius,
  refractionHeight,
  maxMag,
  floor = 0,
  rasterScale = 1
): string {
  const key = `r|${w}|${h}|${radius}|${refractionHeight}|${maxMag}|${floor}|${rasterScale}`
  const hit = cacheGet(key)
  if (hit !== undefined) return hit
  const W = Math.max(2, Math.round(w * rasterScale))
  const H = Math.max(2, Math.round(h * rasterScale))
  const field = makeField(w, h, radius, refractionHeight, maxMag, floor)
  const f = [0, 0, 0]
  const url = rasterMap(W, H, (x, y, out) => {
    field((x + 0.5) / rasterScale - w / 2, (y + 0.5) / rasterScale - h / 2, f)
    out[0] = encodeChannel(f[0], maxMag)
    out[1] = encodeChannel(f[1], maxMag)
  })
  return cacheSet(key, url)
}

/**
 * 7 抽样色散位移图（原版 RoundedRectRefractionWithDispersionShaderString）。
 *
 * 原版采样位置 = refractedScreen + dispersedOffset * f
 *            = screenCoord + base + (base * I0) * f     （base = 基础折射位移）
 * 所以第 k 张图的位移向量必须是 base * (1 + dispersion * I0 * f_k)：
 * base 必须留在里面 —— 只烘焙 base * I0 的话，I0 = 0 的两条中轴线（cx = 0 / cy = 0）
 * 会完全没有位移，边缘环带正中间留下一道不折射的死带。
 *
 * 归一化：|1 + dispersion*I0*f| 最大 = 1 + |dispersion|，所以调用方
 * feDisplacementMap 的 scale = 2 * maxMag * (1 + |dispersion|) * pressProgress。
 * 每个抽样单独一张图：scale 是整条位移向量的乘性缩放，没法用「一张图 + 不同 scale」
 * 表达 base + base*I0*f 这种带常数项的组合。
 */
export function generateDispersedLensMaps(
  w,
  h,
  radius,
  refractionHeight,
  maxMag,
  dispersion,
  tapFactors,
  rasterScale = 1
): string[] {
  const W = Math.max(2, Math.round(w * rasterScale))
  const H = Math.max(2, Math.round(h * rasterScale))
  const field = makeField(w, h, radius, refractionHeight, maxMag, 0)
  const norm = maxMag * (1 + Math.abs(dispersion))
  const f = [0, 0, 0]
  return tapFactors.map(fk => {
    const key = `d|${w}|${h}|${radius}|${refractionHeight}|${maxMag}|${dispersion}|${fk}|${rasterScale}`
    const hit = cacheGet(key)
    if (hit !== undefined) return hit
    const url = rasterMap(W, H, (x, y, out) => {
      field((x + 0.5) / rasterScale - w / 2, (y + 0.5) / rasterScale - h / 2, f)
      const s = 1 + dispersion * f[2] * fk
      out[0] = encodeChannel(f[0] * s, norm)
      out[1] = encodeChannel(f[1] * s, norm)
    })
    return cacheSet(key, url)
  })
}

/** 胶囊（radius = h/2）特例，底栏用 */
export function generateCapsuleLensMap(
  w,
  h,
  refractionHeight,
  maxMag,
  floor = 0,
  rasterScale = 1
): string {
  return generateRoundedRectLensMap(
    w,
    h,
    Math.min(h / 2, w / 2),
    refractionHeight,
    maxMag,
    floor,
    rasterScale
  )
}