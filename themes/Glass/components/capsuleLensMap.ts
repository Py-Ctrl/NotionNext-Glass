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
  // 椭圆近似胶囊/圆角矩形的径向轮廓半径（a=水平半轴，b=垂直半轴）。
  // 全用"指向圆心"的径向凸透镜场：方向随角度连续，位移按到轮廓径向距离
  // 从边缘向中心平滑衰减 —— 消除旧实现 center 区轴向方向在胶囊(radius=h/2、
  // 核心盒退化为一条水平线)时产生的正中心断层/空心带。
  // minRatio=0 时仍等于纯外壳带（兼容 useLensBackdrop 等外围调用）；>0 时满幅贯穿。
  const a = Math.max(1, hx)
  const b = Math.max(1, Math.min(hy, r))

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const dx = x + 0.5 - hx
      const dy = y + 0.5 - hy
      const dist = Math.sqrt(dx * dx + dy * dy)

      let ox = 0
      let oy = 0
      if (dist < 1e-3) {
        // 正中心：方向无定义，位移置 0（避免奇点，凸透镜中心本就该收敛）
        data[(y * W + x) * 4 + 3] = 255
        data[(y * W + x) * 4 + 2] = 0
        data[(y * W + x) * 4 + 1] = 128
        data[(y * W + x) * 4] = 128
        continue
      }
      const cosT = dx / dist
      const sinT = dy / dist
      // 该方向从中心到（近似）胶囊轮廓的距离；edgeDist = 到轮廓的最短径向距离
      const re = (a * b) / Math.sqrt(b * b * cosT * cosT + a * a * sinT * sinT)
      let edgeDist = re - dist
      if (edgeDist >= 0 && edgeDist <= refractionHeight) {
        const ft = edgeDist / refractionHeight // 0=边缘 → 1=中心(作用域内缘)
        const mag = maxMag * (minRatio + (1 - minRatio) * Math.sqrt(1 - ft * ft))
        // 指向圆心 = 向内采样 = 边缘放大（凸透镜）；正中心 dist→0 处 mag→0 收敛
        ox = cosT * mag
        oy = sinT * mag
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
