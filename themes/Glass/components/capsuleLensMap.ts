// @ts-nocheck
'use client'

/**
 * 生成圆角矩形透镜的位移图（feDisplacementMap 的 in2 输入），返回 PNG data URL。
 *
 * 编码方式：R/G 通道存归一化偏移向量
 *   channel = 0.5 + 0.5 * offset / maxMag
 * 配合 filter 的 scale = 2 * maxMag，最终位移 = scale * (channel - 0.5) = offset（像素）。
 *
 * 位移场：
 *   - 边缘处最强（maxMag），方向取边界内法线（原版 liquid-glass 的边缘折射观感）；
 *   - 向内侧按原版 circleMap 剖面平滑衰减，到 refractionHeight 处归零（斜率为 0）；
 *   - 内部保留 floor 比例的下限位移，方向切到「指向中心」的径向场：
 *     内法线场在中轴上会整体翻转 180°，一旦加下限就会在正中留下一条镜像接缝
 *     （内容被切开），径向场只在正中心有奇点，用中心斜坡平滑归零即可。
 *   floor = 0 时退化为原版「只有边缘环带折射」。
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
  floor = 0
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
  const refH = Math.max(0.5, refractionHeight)
  const fl = Math.max(0, Math.min(0.95, floor))
  // 中心斜坡半径：径向位移在正中心必须平滑归零，否则 floor 会让正中一小圈
  // 内容镜像翻转（看上去是「中间一个不明物体」）
  const centerRamp = Math.max(8, Math.min(hx, hy) * 0.5)

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

      // 原版剖面（RoundedRectRefractionWithDispersionShaderString）：
      //   x = 1 - edgeDist/refractionHeight（1 = 边缘 → 0 = 作用域内边界）
      //   profile = circleMap(x) = 1 - sqrt(1 - x*x)
      // 边缘处 = 1、内边界处 = 0 且斜率为 0 —— 位移平滑收束，不留硬边接缝。
      const px = Math.max(0, 1 - edgeDist / refH)
      const profile = 1 - Math.sqrt(Math.max(0, 1 - px * px))
      const mag = maxMag * (fl + (1 - fl) * profile)

      // 方向：边缘用内法线，内部用径向（避免中轴翻转接缝）
      const rho = Math.sqrt(dx * dx + dy * dy)
      let ux = nx
      let uy = ny
      if (rho > 1e-3) {
        const rx = -dx / rho
        const ry = -dy / rho
        ux = profile * nx + (1 - profile) * rx
        uy = profile * ny + (1 - profile) * ry
        const len = Math.sqrt(ux * ux + uy * uy)
        if (len > 1e-6) {
          ux /= len
          uy /= len
        } else {
          ux = 0
          uy = 0
        }
      }
      // 中心斜坡：位移在正中心平滑归零
      let ramp = 1
      if (rho < centerRamp) {
        const t = rho / centerRamp
        ramp = t * t * (3 - 2 * t)
      }

      const ox = ux * mag * ramp
      const oy = uy * mag * ramp

      const i = (y * W + x) * 4
      data[i] = Math.max(0, Math.min(255, Math.round(255 * (0.5 + (0.5 * ox) / maxMag))))
      data[i + 1] = Math.max(0, Math.min(255, Math.round(255 * (0.5 + (0.5 * oy) / maxMag))))
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
  maxMag: number,
  floor = 0
): string {
  return generateRoundedRectLensMap(w, h, Math.min(h / 2, w / 2), refractionHeight, maxMag, floor)
}
