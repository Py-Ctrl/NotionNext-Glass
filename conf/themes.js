/**
 * 主题清单（静态）。
 * 与 next.config.js 中 scanSubdirectories('./themes') 的扫描结果保持一致。
 * 该清单用于 themes/theme.js 校验主题名，替代已弃用的 next/config(# publicRuntimeConfig)。
 * 新增主题目录时，请同步在此追加目录名。
 */
module.exports = {
  THEMES: [
    'claude',
    'commerce',
    'endspace',
    'example',
    'fukasawa',
    'fuwari',
    'game',
    'gitbook',
    'heo',
    'hexo',
    'landing',
    'liquidglass',
    'magzine',
    'matery',
    'medium',
    'movie',
    'nav',
    'next',
    'nobelium',
    'opc',
    'photo',
    'plog',
    'proxio',
    'simple',
    'starter',
    'thoughtlite',
    'typography',
    'xuhome'
  ]
}