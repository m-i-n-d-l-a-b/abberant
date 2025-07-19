/**
 * WebGL Support Detection and Fallbacks
 * 
 * This utility provides functions to detect WebGL support and handle fallbacks
 * for devices that don't support WebGL or have limited capabilities.
 * 
 * All functions that access browser APIs are wrapped to prevent SSR errors.
 */

import React from 'react'

export interface WebGLSupportInfo {
  supported: boolean
  version: string | null
  vendor: string | null
  renderer: string | null
  maxTextureSize: number
  maxViewportDims: [number, number]
  extensions: string[]
  hasBasicSupport: boolean
  hasAdvancedSupport: boolean
}

/**
 * Default WebGL support info for SSR
 */
const DEFAULT_WEBGL_INFO: WebGLSupportInfo = {
  supported: false,
  version: null,
  vendor: null,
  renderer: null,
  maxTextureSize: 0,
  maxViewportDims: [0, 0],
  extensions: [],
  hasBasicSupport: false,
  hasAdvancedSupport: false
}

/**
 * Checks if the code is running in a browser environment
 */
function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined'
}

/**
 * Detects WebGL support and capabilities (client-side only)
 */
export function detectWebGLSupport(): WebGLSupportInfo {
  // Return default values during SSR
  if (!isBrowser()) {
    return DEFAULT_WEBGL_INFO
  }

  try {
    const canvas = document.createElement('canvas')
    const gl = (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null
    
    if (!gl) {
      return DEFAULT_WEBGL_INFO
    }

    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info')
    const vendor = debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : 'Unknown'
    const renderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'Unknown'
    
    const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE)
    const maxViewportDims = gl.getParameter(gl.MAX_VIEWPORT_DIMS)
    const extensions = gl.getSupportedExtensions() || []
    
    // Check for basic WebGL features
    const hasBasicSupport = extensions.includes('OES_standard_derivatives') &&
                           extensions.includes('OES_element_index_uint')
    
    // Check for advanced features
    const hasAdvancedSupport = extensions.includes('WEBGL_compressed_texture_s3tc') &&
                              extensions.includes('OES_texture_float') &&
                              extensions.includes('OES_texture_float_linear')

    return {
      supported: true,
      version: gl.getParameter(gl.VERSION),
      vendor,
      renderer,
      maxTextureSize,
      maxViewportDims,
      extensions,
      hasBasicSupport,
      hasAdvancedSupport
    }
  } catch (error) {
    console.warn('WebGL detection failed:', error)
    return DEFAULT_WEBGL_INFO
  }
}

/**
 * Checks if the device has sufficient WebGL capabilities for VFX effects (client-side only)
 */
export function hasVFXSupport(): boolean {
  const support = detectWebGLSupport()
  
  if (!support.supported) {
    return false
  }
  
  // Require basic WebGL support and reasonable texture size
  return support.hasBasicSupport && support.maxTextureSize >= 2048
}

/**
 * Gets a fallback message for devices without WebGL support (client-side only)
 */
export function getWebGLFallbackMessage(): string {
  const support = detectWebGLSupport()
  
  if (support.supported) {
    return ''
  }
  
  return 'Your device does not support WebGL. VFX effects will be disabled for better performance.'
}

/**
 * Creates a performance warning for low-end devices (client-side only)
 */
export function getPerformanceWarning(): string | null {
  const support = detectWebGLSupport()
  
  if (!support.supported) {
    return null
  }
  
  // Warn for devices with limited capabilities
  if (support.maxTextureSize < 4096) {
    return 'Your device has limited graphics capabilities. VFX effects may impact performance.'
  }
  
  return null
}

/**
 * Determines optimal VFX quality based on device capabilities (client-side only)
 */
export function getOptimalVFXQuality(): 'low' | 'medium' | 'high' {
  const support = detectWebGLSupport()
  
  if (!support.supported) {
    return 'low'
  }
  
  if (support.maxTextureSize >= 8192 && support.hasAdvancedSupport) {
    return 'high'
  }
  
  if (support.maxTextureSize >= 4096 && support.hasBasicSupport) {
    return 'medium'
  }
  
  return 'low'
}

/**
 * React hook for WebGL support detection
 * Returns null during SSR and actual values after hydration
 */
export function useWebGLSupport() {
  const [webglInfo, setWebglInfo] = React.useState<WebGLSupportInfo | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    // Only run on client-side
    if (isBrowser()) {
      const info = detectWebGLSupport()
      setWebglInfo(info)
    }
    setIsLoading(false)
  }, [])

  return {
    webglInfo,
    isLoading,
    hasVFXSupport: webglInfo?.supported && webglInfo.hasBasicSupport && webglInfo.maxTextureSize >= 2048,
    optimalQuality: webglInfo ? getOptimalVFXQuality() : 'low' as const
  }
}

// Also export as default for compatibility
export default useWebGLSupport 