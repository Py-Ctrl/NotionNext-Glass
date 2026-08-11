const WP_LIGHT = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4'%3E%3Crect width='4' height='4' fill='%23ffffff'/%3E%3C/svg%3E"
const WP_DARK = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4'%3E%3Crect width='4' height='4' fill='%23000000'/%3E%3C/svg%3E"

export const getWallpaper = (isDarkMode) => isDarkMode ? WP_DARK : WP_LIGHT

const WP_TRANSPARENT = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="

export const getTransparentWallpaper = () => WP_TRANSPARENT

const buildGradientSVG = (isDarkMode) => {
  const base = isDarkMode
    ? ['#0a0a1a', '#0f0f23', '#0a1a1f', '#0a0f0a']
    : ['#eef2ff', '#faf5ff', '#ecfeff', '#f0fdf4']

  const spots = isDarkMode
    ? [
        { cx: '20%', cy: '10%', color: '#6366f1', opacity: 0.12 },
        { cx: '80%', cy: '20%', color: '#8b5cf6', opacity: 0.10 },
        { cx: '50%', cy: '80%', color: '#06b6d4', opacity: 0.08 }
      ]
    : [
        { cx: '20%', cy: '10%', color: '#6366f1', opacity: 0.15 },
        { cx: '80%', cy: '20%', color: '#8b5cf6', opacity: 0.12 },
        { cx: '50%', cy: '80%', color: '#06b6d4', opacity: 0.10 }
      ]

  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='800'>
<defs>
<linearGradient id='b' x1='0' y1='0' x2='1' y2='1'>
<stop offset='0' stop-color='${base[0]}'/>
<stop offset='0.3' stop-color='${base[1]}'/>
<stop offset='0.7' stop-color='${base[2]}'/>
<stop offset='1' stop-color='${base[3]}'/>
</linearGradient>
${spots.map((s, i) => `<radialGradient id='s${i}' cx='${s.cx}' cy='${s.cy}' r='0.55'>
<stop offset='0' stop-color='${s.color}' stop-opacity='${s.opacity}'/>
<stop offset='1' stop-color='${s.color}' stop-opacity='0'/>
</radialGradient>`).join('\n')}
</defs>
<rect width='400' height='800' fill='url(#b)'/>
${spots.map((_, i) => `<rect width='400' height='800' fill='url(#s${i})'/>`).join('\n')}
</svg>`

  return 'data:image/svg+xml,' + encodeURIComponent(svg)
}

const GRADIENT_LIGHT = buildGradientSVG(false)
const GRADIENT_DARK = buildGradientSVG(true)

export const getGradientWallpaper = (isDarkMode) => isDarkMode ? GRADIENT_DARK : GRADIENT_LIGHT

const buildBottomBarSVG = (isDarkMode) => {
  const base = isDarkMode
    ? ['#0a1a1f', '#0a0f0a']
    : ['#ecfeff', '#f0fdf4']

  const spots = isDarkMode
    ? [{ cx: '50%', cy: '60%', color: '#06b6d4', opacity: 0.08 }]
    : [{ cx: '50%', cy: '60%', color: '#06b6d4', opacity: 0.10 }]

  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='100'>
<defs>
<linearGradient id='b' x1='0' y1='0' x2='1' y2='1'>
<stop offset='0' stop-color='${base[0]}'/>
<stop offset='1' stop-color='${base[1]}'/>
</linearGradient>
${spots.map((s, i) => `<radialGradient id='s${i}' cx='${s.cx}' cy='${s.cy}' r='0.7'>
<stop offset='0' stop-color='${s.color}' stop-opacity='${s.opacity}'/>
<stop offset='1' stop-color='${s.color}' stop-opacity='0'/>
</radialGradient>`).join('\n')}
</defs>
<rect width='400' height='100' fill='url(#b)'/>
${spots.map((_, i) => `<rect width='400' height='100' fill='url(#s${i})'/>`).join('\n')}
</svg>`

  return 'data:image/svg+xml,' + encodeURIComponent(svg)
}

const BOTTOM_BAR_LIGHT = buildBottomBarSVG(false)
const BOTTOM_BAR_DARK = buildBottomBarSVG(true)

export const getBottomBarWallpaper = (isDarkMode) => isDarkMode ? BOTTOM_BAR_DARK : BOTTOM_BAR_LIGHT
