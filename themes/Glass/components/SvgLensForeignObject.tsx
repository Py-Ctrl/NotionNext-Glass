/**
 * SVG 折射（Firefox 可用）：`foreignObject` + `feDisplacementMap`
 *
 * ## 与主题现有 Chromium 方案的本质区别
 *
 * | | Chromium 方案（BottomTabs） | 本组件（Firefox 可用） |
 * | --- | --- | --- |
 * | 滤镜作用对象 | **背景**（`backdrop-filter: url(#f)`） | **元素自身内容**（SVG `filter` 属性） |
 * | 内容位置 | 普通 HTML，在 SVG 外面 | 塞进 `<foreignObject>`，在 SVG **里面** |
 * | 滤镜引用方式 | CSS `filter: url()` | SVG 的 `filter="url(#id)"` **表现属性** |
 *
 * Firefox **不支持 `backdrop-filter` 的 `url()` 形式**（只支持 blur/saturate 这类函数），
 * 所以「采样背景做折射」这条路在 Firefox 上走不通。绕开办法是反过来：
 * 把内容本身放进 SVG 里，让滤镜作用于内容 —— 这必须借 `<foreignObject>`
 * 才能把 HTML 塞进 SVG。
 *
 * ## Firefox 必须注意的 6 个点（都在下面代码里落实了）
 *
 * 1. **`foreignObject` 的直接子元素必须带 `xmlns="http://www.w3.org/1999/xhtml"`**
 *    Chromium 容错，Firefox 不容错 —— 少了它内容直接不渲染。
 * 2. **`colorInterpolationFilters="sRGB"` 必须显式写**
 *    SVG 滤镜的默认色彩空间是 **linearRGB**，而位移图的 R/G 通道是按 sRGB 编码的。
 *    不写这一条会按线性空间解读通道值，位移量整体偏移。
 *    注意属性名写法：JSX 里写 camelCase（React 会转成 `color-interpolation-filters`，
 *    已实测），纯 HTML 里必须写连字符形式 —— 反过来都会失效/告警。
 * 3. **`filterUnits="userSpaceOnUse"` + 显式 x/y/width/height**
 *    默认的 `objectBoundingBox` 会把滤镜区域按 -10% / +20% 扩张，位移图坐标就对不上了。
 * 4. **滤镜区域要留出位移外扩的余量**
 *    折射会把像素推到位图外面，区域卡得太紧边缘会被裁掉。这里按 `pad = maxMag` 外扩。
 * 5. **`feImage` 要 `preserveAspectRatio="none"`**
 *    否则位移图会按比例内缩，和元素尺寸对不上，折射位置整体偏移。
 * 6. **位移图必须解码完成再挂到 `href`**
 *    未解码时 `feImage` 输出空白，`feDisplacementMap` 拿不到位移数据。
 *    这里用 state 在挂载后再赋值。
 *
 * ## 已知限制
 * - `foreignObject` 里的内容**不能超出**外框尺寸（Firefox 不自动撑高，要显式给 width/height）。
 * - 滤镜会把内容栅格化，**内部文字失去文本选择与亚像素抗锯齿**，适合装饰性容器。
 * - 内容一旦被滤镜处理，`overflow` 裁剪由滤镜区域决定，不再由 CSS `overflow: hidden` 决定。
 * - 本组件用的是「滤镜作用于内容」的路子，**不会**像 `backdrop-filter` 那样采样页面背景，
 *   所以玻璃的"透视背景"观感需要自己在 `children` 里画出来。
 */
import React, { useEffect, useId, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { generateRoundedRectLensMap } from './capsuleLensMap'

// 折射强度（与主题 Chromium 方案保持同一量纲：位移图按 maxMag 归一化，
// feDisplacementMap 的 scale = 2 * maxMag）
const REFRACTION_HEIGHT = 24
const MAX_MAG = 20

export interface SvgLensForeignObjectProps {
  width: number
  height: number
  radius?: number
  className?: string
  style?: CSSProperties
  children?: ReactNode
}

export default function SvgLensForeignObject({
  width,
  height,
  radius = 24,
  className,
  style,
  children,
}: SvgLensForeignObjectProps) {
  const uid = useId()
  const filterId = `svg-lens-${uid.replace(/:/g, '')}`
  const [mapUrl, setMapUrl] = useState<string | null>(null)

  // 位移图在挂载后再生成并挂上，确保 feImage 拿到的是已解码的图
  useEffect(() => {
    if (!width || !height) return
    setMapUrl(generateRoundedRectLensMap(width, height, radius, REFRACTION_HEIGHT, MAX_MAG))
  }, [width, height, radius])

  if (!width || !height) return null

  // 滤镜区域向外扩 pad，避免折射后的像素被裁掉
  const pad = MAX_MAG

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      style={style}
    >
      <defs>
        <filter
          id={filterId}
          filterUnits='userSpaceOnUse'
          x={-pad}
          y={-pad}
          width={width + pad * 2}
          height={height + pad * 2}
          /* 这里写 camelCase 是**对的**：React 会自动渲染成
             color-interpolation-filters（已实测验证）。反过来在 JSX 里写连字符
             虽然也能渲染，但 React 会报 "Invalid DOM property" 警告。
             注意纯 HTML 里规则相反 —— 必须写连字符形式，camelCase 会被
             HTML 解析器小写化后丢弃。 */
          colorInterpolationFilters='sRGB'
        >
          {mapUrl && (
            <feImage
              href={mapUrl}
              x={0}
              y={0}
              width={width}
              height={height}
              preserveAspectRatio='none'
              result='lensMap'
            />
          )}
          <feDisplacementMap
            in='SourceGraphic'
            in2='lensMap'
            scale={MAX_MAG * 2}
            xChannelSelector='R'
            yChannelSelector='G'
          />
        </filter>
      </defs>

      {/* 滤镜通过 SVG 表现属性引用，不用 CSS filter: url() */}
      <g filter={`url(#${filterId})`}>
        <foreignObject x={0} y={0} width={width} height={height}>
          {/* xmlns 不能省：Firefox 缺了它整块内容不渲染。
              TS 的 HTMLDivElement 类型里没有 xmlns（它属于 XML 命名空间声明），
              所以用展开断言绕过类型检查，运行时属性照常输出。 */}
          <div
            {...({ xmlns: 'http://www.w3.org/1999/xhtml' } as Record<string, string>)}
            style={{ width: `${width}px`, height: `${height}px`, overflow: 'hidden' }}
          >
            {children}
          </div>
        </foreignObject>
      </g>
    </svg>
  )
}
