/**
 * Storage utility functions for localStorage operations
 * Provides safe get/set operations with error handling and JSON serialization
 */

/**
 * Retrieves a value from localStorage and attempts to parse it as JSON
 * @param key - The localStorage key to retrieve
 * @param defaultValue - Optional default value to return if key doesn't exist or parsing fails
 * @returns The parsed value or the default value
 */
export function getFromStorage<T>(key: string, defaultValue?: T): T | null {
  try {
    const item = localStorage.getItem(key)
    if (item === null) {
      return defaultValue !== undefined ? defaultValue : null
    }
    return JSON.parse(item) as T
  } catch (error) {
    console.warn(`Failed to retrieve or parse localStorage key "${key}":`, error)
    return defaultValue !== undefined ? defaultValue : null
  }
}

/**
 * Saves a value to localStorage with JSON serialization
 * @param key - The localStorage key to save to
 * @param value - The value to save (will be JSON serialized)
 * @returns true if successful, false if failed
 */
export function saveToStorage<T>(key: string, value: T): boolean {
  try {
    const serializedValue = JSON.stringify(value)
    localStorage.setItem(key, serializedValue)
    return true
  } catch (error) {
    console.error(`Failed to save to localStorage key "${key}":`, error)
    return false
  }
}

/**
 * Removes a key from localStorage
 * @param key - The localStorage key to remove
 * @returns true if successful, false if failed
 */
export function removeFromStorage(key: string): boolean {
  try {
    localStorage.removeItem(key)
    return true
  } catch (error) {
    console.error(`Failed to remove localStorage key "${key}":`, error)
    return false
  }
}

/**
 * Checks if localStorage is available and working
 * @returns true if localStorage is available, false otherwise
 */
export function isStorageAvailable(): boolean {
  try {
    const testKey = '__storage_test__'
    localStorage.setItem(testKey, 'test')
    localStorage.removeItem(testKey)
    return true
  } catch {
    return false
  }
} 