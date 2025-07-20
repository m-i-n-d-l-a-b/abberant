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