// @ts-nocheck
'use client'

/**
 * 生成圆角矩形透镜的位移图（feDisplacementMap 的 in2 输入），返回 PNG data URL。
 *
 * 编码方式：R/G 通道存归一化偏移向量
 *   channel = 0.5 + 0.5 * offset / maxMag
 * 配合 filter 的 scale = 2 * maxMag，最终位移 = scale * (channel - 0.5) = offset（像素）。
 *
 * 位移场：边缘处最强、方向指向内部（向内采样 = 边缘放大，等效
 * WebGL 版 refractionAmount 为负的透镜效果），向内按圆弧轮廓衰减，
 * 超过 refractionHeight 后归零（透镜只作用于边缘环带）。
 *
 * 注意：feImage 引用 data URL 是异步加载的，Chromium 加载完成后不会自动
 * 重跑 backdrop-filter —— 挂载后必须强制重绘（backdrop-filter 关-开切换），
 * 否则位移图不生效（见 BottomTabs / useLensBackdrop 里的 repaint effect）。
 */
export function generateRoundedRectLensMap(
  w: number,
  h: number,
  radius: number,
  refractionHeight: number,
  maxMag: number,
  minRatio: number = 0
): string {
  const W = Math.max(2, Math.round(w))
  const H = Math.max(2, Math.round(h))
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) return ''

  const img = ctx.createImageData(W, H)
  const data = img.data

  const hx = W / 2
  const hy = H / 2
  const r = Math.max(0, Math.min(radius, Math.min(hx, hy)))
  // 核心盒：圆角矩形向内缩 r 后的直边区域（胶囊时退化为线段）
  const coreX = hx - r
  const coreY = hy - r

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const dx = x + 0.5 - hx
      const dy = y + 0.5 - hy

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
        if (edgeDist === dL) {
          nx = 1
        } else if (edgeDist === dR) {
          nx = -1
        } else if (edgeDist === dT) {
          ny = 1
        } else {
          ny = -1
        }
      }

      let ox = 0
      let oy = 0
      // 原版凸透镜折射贯穿全幅：位移随到边缘距离从最强向中心平滑衰减，
      // 不再只限制在外层壳带（那会让核心区位移场为 0 → 中间完全无折射）。
      // minRatio 保证中心也保留非零位移（0 = 只边缘、1 = 全域满磁）。
      if (edgeDist >= 0 && edgeDist <= refractionHeight) {
        const ft = edgeDist / refractionHeight // 0=边缘 → 1=中心(作用域边缘)
        const mag = maxMag * (minRatio + (1 - minRatio) * Math.sqrt(1 - ft * ft))
        ox = nx * mag
        oy = ny * mag
      }

      const i = (y * W + x) * 4
      data[i] = Math.round(255 * (0.5 + (0.5 * ox) / maxMag))
      data[i + 1] = Math.round(255 * (0.5 + (0.5 * oy) / maxMag))
      data[i + 2] = 0
      data[i + 3] = 255
    }
  }

  ctx.putImageData(img, 0, 0)
  return canvas.toDataURL('image/png')
}

/** 胶囊（radius = h/2）特例，底栏用 */
export function generateCapsuleLensMap(
  w: number,
  h: number,
  refractionHeight: number,
  maxMag: number
): string {
  return generateRoundedRectLensMap(w, h, Math.min(h / 2, w / 2), refractionHeight, maxMag)
}
