/**
 * Storage utility functions
 * 
 * Simple wrapper around localStorage for saving and retrieving game data.
 */

/**
 * Save data to localStorage
 * @param key - The storage key
 * @param value - The value to store (will be JSON stringified)
 */
export function saveToStorage(key: string, value: any): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    console.warn('Failed to save to localStorage:', error)
  }
}

/**
 * Get data from localStorage
 * @param key - The storage key
 * @param defaultValue - Default value if key doesn't exist or parsing fails
 * @returns The stored value or defaultValue
 */
export function getFromStorage<T>(key: string, defaultValue?: T): T | null {
  try {
    const item = localStorage.getItem(key)
    if (item === null) {
      return defaultValue || null
    }
    return JSON.parse(item)
  } catch (error) {
    console.warn('Failed to get from localStorage:', error)
    return defaultValue || null
  }
} 

/**
 * Convert a color string to an rgba() string with alpha.
 *
 * Accepts 3- and 6-digit hex with or without '#', and passes an `rgb()` or
 * `rgba()` input through with the requested alpha. The palette emits `rgb()`,
 * and a helper that only understood hex would throw on every colour the game
 * actually draws with.
 *
 * @param color - The color string (e.g. '#fff', '#ff0000', 'rgb(8, 8, 8)')
 * @param alpha - Alpha value (0-1)
 * @returns rgba(r,g,b,a) string
 */
export function hexToRgba(color: string, alpha: number = 1): string {
  const rgb = color.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/i)
  if (rgb) {
    return `rgba(${rgb[1]},${rgb[2]},${rgb[3]},${alpha})`
  }

  let c = color.replace('#', '')
  if (c.length === 3) {
    c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2]
  }
  if (c.length !== 6) {
    throw new Error('Invalid color: ' + color)
  }
  const r = parseInt(c.substring(0, 2), 16)
  const g = parseInt(c.substring(2, 4), 16)
  const b = parseInt(c.substring(4, 6), 16)
  return `rgba(${r},${g},${b},${alpha})`
} 