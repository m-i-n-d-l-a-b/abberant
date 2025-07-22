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
 * Convert a hex color string to an rgba() string with alpha
 * Supports 3-digit and 6-digit hex, with or without '#'.
 * @param hex - The hex color string (e.g. '#fff', '#ff0000')
 * @param alpha - Alpha value (0-1)
 * @returns rgba(r,g,b,a) string
 */
export function hexToRgba(hex: string, alpha: number = 1): string {
  let c = hex.replace('#', '')
  if (c.length === 3) {
    c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2]
  }
  if (c.length !== 6) {
    throw new Error('Invalid hex color: ' + hex)
  }
  const r = parseInt(c.substring(0, 2), 16)
  const g = parseInt(c.substring(2, 4), 16)
  const b = parseInt(c.substring(4, 6), 16)
  return `rgba(${r},${g},${b},${alpha})`
} 