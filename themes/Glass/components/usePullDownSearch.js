/**
 * 下拉召唤搜索框。
 *
 * 触发条件（缺一不可）：
 *   1. 从页面任意位置开始向下拖 —— 不限定从顶部边缘起手
 *   2. 方向以竖直向下为主（|dy| > |dx| * AXIS_RATIO）
 *   3. 起手处的滚动容器已经在顶部 —— 还能往上滚时，下拉是正常滚动，不抢
 *   4. 没有正在选中的文字（拖拽选字不该触发）
 *   5. 起手元素不是输入框 / 按钮 / 链接等交互元素
 * 位移超过 THRESHOLD 触发一次，之后本次手势失效直到抬起。
 */
import { useEffect } from 'react'

const THRESHOLD = 64 // 触发所需的下拉位移（px）
const MAX_DURATION = 900 // 超过此时长的拖拽视为滚动，不算"下拉召唤"
const AXIS_RATIO = 1.4 // |dy| 至少是 |dx| 的多少倍

/**
 * 只排除「文本输入类」元素。
 * 不排除 <a> —— 首页文章卡片本身就是链接，排掉的话整页都拖不动；
 * 链接也没有原生拖拽行为，不会和手势打架。
 */
function isInteractive(el) {
  if (!el || !el.tagName) return false
  const tag = el.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true
  return !!el.isContentEditable
}

/** 起手元素所在的最内层滚动容器是否还能往上滚 */
function canScrollUp(el) {
  let n = el
  while (n && n !== document.body && n !== document.documentElement) {
    const oy = getComputedStyle(n).overflowY
    if (/(auto|scroll)/.test(oy) && n.scrollHeight > n.clientHeight) {
      return n.scrollTop > 0
    }
    n = n.parentElement
  }
  return window.scrollY > 0
}

export function usePullDownSearch(onTrigger, enabled = true) {
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return
    let startY = 0
    let startX = 0
    let startT = 0
    let tracking = false
    let fired = false

    const onDown = e => {
      if (e.button != null && e.button !== 0) return
      if (isInteractive(e.target)) return
      const sel = window.getSelection && window.getSelection()
      if (sel && sel.toString().length > 0) return
      if (canScrollUp(e.target)) return
      startY = e.clientY
      startX = e.clientX
      startT = Date.now()
      tracking = true
      fired = false
    }

    const onMove = e => {
      if (!tracking || fired) return
      const dy = e.clientY - startY
      if (dy <= 0) return
      if (dy < Math.abs(e.clientX - startX) * AXIS_RATIO) { tracking = false; return }
      if (Date.now() - startT > MAX_DURATION) { tracking = false; return }
      if (dy >= THRESHOLD) {
        fired = true
        onTrigger()
      }
    }

    const onUp = () => { tracking = false }

    window.addEventListener('pointerdown', onDown, { passive: true })
    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerup', onUp, { passive: true })
    window.addEventListener('pointercancel', onUp, { passive: true })
    return () => {
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
  }, [onTrigger, enabled])
}
