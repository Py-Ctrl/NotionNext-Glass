/**
 * Firefox 玻璃降级
 *
 * ## 问题
 * 主题的玻璃折射走 `backdrop-filter: url(#lens-xxx)`，这是 **Chromium 专属**。
 * Firefox 不但不支持 `url()` 形式，还会把**整条声明丢弃** —— 所以连模糊都没了，
 * 玻璃只剩一层很淡的底色，看起来是一片死灰。
 *
 * ## 为什么不做「折射」而是「降级」
 * `backdrop-filter` 的本质是**采样元素背后的内容**再处理。Firefox 没有这个能力，
 * SVG 滤镜也无法访问元素外部的内容 —— 所以**折射在 Firefox 上做不到**。
 * （唯一例外是内容本身就在 SVG 里，见 `SvgLensForeignObject.tsx`，
 *  那只适用于自包含的小部件，不能作用于任意页面内容。）
 *
 * 所以这里退而求其次：给 Firefox 一个**它支持的 `blur()` 降级**，保住磨砂玻璃观感。
 * 视觉上比 Chromium 少一层折射，但不再是死灰。
 *
 * ## 为什么用 UA 判定而不是 @supports
 * Firefox 的 `CSS.supports('backdrop-filter', 'url(#x)')` 会**误报 true**
 * （实测 Firefox 157 返回 true），`@supports` 同样靠不住。只能看 UA。
 *
 * ## 与 BottomTabs 的关系
 * 底栏（BottomTabs）本来就有自己的模糊降级分支，不受这里影响。
 */
import { useEffect } from 'react'

const UA_CLASS = 'is-firefox'

export default function GlassFirefoxLens () {
  useEffect(() => {
    if (typeof window === 'undefined') return
    const isFirefox = /Firefox\//.test(navigator.userAgent)
    if (!isFirefox) return
    // 挂个标记类，具体样式在 style.js 里（html.is-firefox ...）
    document.documentElement.classList.add(UA_CLASS)
    return () => {
      document.documentElement.classList.remove(UA_CLASS)
    }
  }, [])

  return null
}
