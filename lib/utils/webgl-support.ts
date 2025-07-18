/**
 * WebGL Support Detection and Fallbacks
 * 
 * This utility provides functions to detect WebGL support and handle fallbacks
 * for devices that don't support WebGL or have limited capabilities.
 */

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
 * Detects WebGL support and capabilities
 */
export function detectWebGLSupport(): WebGLSupportInfo {
  const canvas = document.createElement('canvas')
  const gl = (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null
  
  if (!gl) {
    return {
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
}

/**
 * Checks if the device has sufficient WebGL capabilities for VFX effects
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
 * Gets a fallback message for devices without WebGL support
 */
export function getWebGLFallbackMessage(): string {
  const support = detectWebGLSupport()
  
  if (support.supported) {
    return ''
  }
  
  return 'Your device does not support WebGL. VFX effects will be disabled for better performance.'
}

/**
 * Creates a performance warning for low-end devices
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
 * Determines optimal VFX quality based on device capabilities
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