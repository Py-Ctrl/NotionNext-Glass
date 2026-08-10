const WP_LIGHT = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4'%3E%3Crect width='4' height='4' fill='%23ffffff'/%3E%3C/svg%3E"
const WP_DARK = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4'%3E%3Crect width='4' height='4' fill='%23000000'/%3E%3C/svg%3E"

export const getWallpaper = (isDarkMode) => isDarkMode ? WP_DARK : WP_LIGHT
