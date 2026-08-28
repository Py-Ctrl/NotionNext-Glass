// @ts-nocheck
'use client'

/**
 * 生成胶囊透镜的位移图（feDisplacementMap 的 in2 输入）。
 *
 * 编码方式：R/G 通道存归一化偏移向量
 *   channel = 0.5 + 0.5 * offset / maxMag
 * 配合 filter 的 scale = 2 * maxMag，最终位移 = scale * (channel - 0.5) = offset（像素）。
 *
 * 位移场：胶囊边缘处最强、方向指向中轴（向内采样 = 边缘放大，等效
 * WebGL 版 refractionAmount 为负的透镜效果），向内按圆弧轮廓衰减，
 * 超过 refractionHeight 后归零（透镜只作用于边缘环带）。
 *
 * 返回 PNG data URL，尺寸与传入的 w/h 一致。
 */
export function generateCapsuleLensMap(
  w: number,
  h: number,
  refractionHeight: number,
  maxMag: number
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

  // 胶囊 = 圆角矩形（radius = h/2）：中轴线段 (r,r) → (W-r,r)，
  // 任意点到胶囊边界的距离 = 点到中轴的距离 - r。
  const r = Math.min(H / 2, W / 2)
  const ax = r
  const ay = r
  const bx = W - r
  const by = r
  const segLenSq = Math.max(1e-6, (bx - ax) * (bx - ax) + (by - ay) * (by - ay))

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const px = x + 0.5
      const py = y + 0.5

      // 点到中轴线段的最近点
      let t = ((px - ax) * (bx - ax) + (py - ay) * (by - ay)) / segLenSq
      t = Math.max(0, Math.min(1, t))
      const cx = ax + (bx - ax) * t
      const cy = ay + (by - ay) * t

      const dxv = px - cx
      const dyv = py - cy
      const dist = Math.sqrt(dxv * dxv + dyv * dyv) || 1e-6
      const edgeDist = r - dist // >0 在胶囊内部，=距边缘的深度

      let ox = 0
      let oy = 0
      if (edgeDist > 0 && edgeDist < refractionHeight) {
        const ft = edgeDist / refractionHeight // 0=边缘 1=环带内边界
        const mag = maxMag * Math.sqrt(1 - ft * ft) // 边缘最强，圆弧衰减
        // 向内法线 = (c - p)/dist；采样点向中心偏移 → 边缘放大
        ox = -(dxv / dist) * mag
        oy = -(dyv / dist) * mag
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
