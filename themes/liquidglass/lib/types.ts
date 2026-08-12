// @ts-nocheck
import type { GlassHighlight } from './renderer'

export const DP = 1
export const draggingGroups = new Set<string>()

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

export const BUTTON_HEIGHT = 48 * DP
export const BUTTON_HORIZONTAL_PADDING = 16 * DP
export const TEXT_FONT_SIZE_PX = 15 * DP

export const SLIDER_TRACK_H = 6 * DP
export const SLIDER_KNOB_W = 40 * DP
export const SLIDER_KNOB_H = 24 * DP
export const SLIDER_HIT_H = 48 * DP
export const FONT_FAMILY =
  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'

export const GLASS_PARAMS = {
  refractionHeight: 12 * DP,
  refractionAmount: -24 * DP,
  depthEffect: false,
  chromaticAberration: false,
  blurRadius: 2 * DP,
  saturation: 1.5,
  brightness: 0,
  contrast: 1,
}

export const DEFAULT_HIGHLIGHT: GlassHighlight = {
  mode: 0,
  color: [1, 1, 1],
  angle: 45 * Math.PI / 180,
  falloff: 1.0,
  alpha: 0.5,
  widthDp: 0.5,
}

export const DEFAULT_SHADOW = {
  radius: 24 * DP,
  alpha: 0.1,
  offsetX: 0,
  offsetY: (24 / 6) * DP,
  color: [0, 0, 0] as [number, number, number],
}

export interface ThemePalette {
  homeContentColor: [number, number, number, number]
  homeSubtitleColor: [number, number, number, number]
  homeTextHalo: 'light' | 'dark' | 'none'
  toggleAccent: [number, number, number]
  toggleTrackOff: [number, number, number, number]
  toggleCardBg: [number, number, number, number]
  sliderAccent: [number, number, number]
  sliderTrackOff: [number, number, number, number]
  sliderCardBg: [number, number, number, number]
  tabsContentColor: [number, number, number, number]
  tabsAccent: [number, number, number]
  tabsContainer: [number, number, number, number]
  tabsTextHalo: 'light' | 'dark' | 'none'
  dialogContentColor: [number, number, number, number]
  dialogAccent: [number, number, number, number]
  dialogContainer: [number, number, number, number]
  dialogDim: [number, number, number, number]
  dialogBlurRadius: number
  dialogBrightness: number
  magnifierContentColor: [number, number, number, number]
  magnifierAccent: [number, number, number, number]
  magnifierCardBg: [number, number, number, number]
  controlCenterAccent: [number, number, number, number]
  progressiveContentColor: [number, number, number, number]
  progressiveTint: [number, number, number, number]
  progressiveTextHalo: 'light' | 'dark' | 'none'
  adaptiveContentColor: [number, number, number, number]
  backIconColor: [number, number, number, number]
  buttonSurface: [number, number, number, number]
}

export const LIGHT_PALETTE: ThemePalette = {
  homeContentColor: [0, 0, 0, 1],
  homeSubtitleColor: [0x00 / 255, 0x88 / 255, 0xff / 255, 1],
  homeTextHalo: 'dark',
  toggleAccent: [0x34 / 255, 0xc7 / 255, 0x59 / 255],
  toggleTrackOff: [0x78 / 255, 0x78 / 255, 0x78 / 255, 0.2],
  toggleCardBg: [1, 1, 1, 1],
  sliderAccent: [0x00 / 255, 0x88 / 255, 0xff / 255],
  sliderTrackOff: [0x78 / 255, 0x78 / 255, 0x78 / 255, 0.2],
  sliderCardBg: [1, 1, 1, 1],
  tabsContentColor: [0, 0, 0, 1],
  tabsAccent: [0x00 / 255, 0x88 / 255, 0xff / 255],
  tabsContainer: [0xfa / 255, 0xfa / 255, 0xfa / 255, 0.4],
  tabsTextHalo: 'dark',
  dialogContentColor: [0, 0, 0, 1],
  dialogAccent: [0x00 / 255, 0x88 / 255, 0xff / 255, 1],
  dialogContainer: [0xfa / 255, 0xfa / 255, 0xfa / 255, 0.6],
  dialogDim: [0x29 / 255, 0x29 / 255, 0x3a / 255, 0.23],
  dialogBlurRadius: 16 * DP,
  dialogBrightness: 0.2,
  magnifierContentColor: [0, 0, 0, 1],
  magnifierAccent: [0x00 / 255, 0x88 / 255, 0xff / 255, 1],
  magnifierCardBg: [1, 1, 1, 0.9],
  controlCenterAccent: [0x00 / 255, 0x88 / 255, 0xff / 255, 1],
  progressiveContentColor: [0, 0, 0, 1],
  progressiveTint: [1, 1, 1, 1],
  progressiveTextHalo: 'dark',
  adaptiveContentColor: [0, 0, 0, 1],
  backIconColor: [0, 0, 0, 1],
  buttonSurface: [1, 1, 1, 0.3],
}

export const DARK_PALETTE: ThemePalette = {
  homeContentColor: [1, 1, 1, 1],
  homeSubtitleColor: [0x00 / 255, 0x88 / 255, 0xff / 255, 1],
  homeTextHalo: 'light',
  toggleAccent: [0x30 / 255, 0xd1 / 255, 0x58 / 255],
  toggleTrackOff: [0x78 / 255, 0x78 / 255, 0x80 / 255, 0.36],
  toggleCardBg: [0x12 / 255, 0x12 / 255, 0x12 / 255, 1],
  sliderAccent: [0x00 / 255, 0x91 / 255, 0xff / 255],
  sliderTrackOff: [0x78 / 255, 0x78 / 255, 0x80 / 255, 0.36],
  sliderCardBg: [0x12 / 255, 0x12 / 255, 0x12 / 255, 1],
  tabsContentColor: [1, 1, 1, 1],
  tabsAccent: [0x00 / 255, 0x91 / 255, 0xff / 255],
  tabsContainer: [0x12 / 255, 0x12 / 255, 0x12 / 255, 0.4],
  tabsTextHalo: 'light',
  dialogContentColor: [1, 1, 1, 1],
  dialogAccent: [0x00 / 255, 0x91 / 255, 0xff / 255, 1],
  dialogContainer: [0x12 / 255, 0x12 / 255, 0x12 / 255, 0.4],
  dialogDim: [0x12 / 255, 0x12 / 255, 0x12 / 255, 0.56],
  dialogBlurRadius: 8 * DP,
  dialogBrightness: 0,
  magnifierContentColor: [1, 1, 1, 1],
  magnifierAccent: [0x00 / 255, 0x91 / 255, 0xff / 255, 1],
  magnifierCardBg: [0x12 / 255, 0x12 / 255, 0x12 / 255, 0.9],
  controlCenterAccent: [0x00 / 255, 0x91 / 255, 0xff / 255, 1],
  progressiveContentColor: [1, 1, 1, 1],
  progressiveTint: [0x80 / 255, 0x80 / 255, 0x80 / 255, 1],
  progressiveTextHalo: 'light',
  adaptiveContentColor: [1, 1, 1, 1],
  backIconColor: [1, 1, 1, 1],
  buttonSurface: [0x12 / 255, 0x12 / 255, 0x12 / 255, 0.4],
}

export function getPalette(isLightTheme: boolean): ThemePalette {
  return isLightTheme ? LIGHT_PALETTE : DARK_PALETTE
}

let _measureCtx: CanvasRenderingContext2D | null = null
export function measureTextWidth(text: string, fontPx: number, weight = 400): number {
  if (typeof document !== 'undefined') {
    if (!_measureCtx) {
      const c = document.createElement('canvas')
      _measureCtx = c.getContext('2d')
    }
    if (_measureCtx) {
      _measureCtx.font = `${weight} ${fontPx}px ${FONT_FAMILY}`
      return _measureCtx.measureText(text).width
    }
  }
  return text.length * fontPx * 0.55
}
