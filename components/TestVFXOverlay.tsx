import React from 'react'
import { VFXDiv } from 'react-vfx'

interface TestVFXOverlayProps {
  isActive: boolean
}

const TestVFXOverlay: React.FC<TestVFXOverlayProps> = ({ isActive }) => {
  if (!isActive) {
    return null
  }

  return (
    <div 
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1000,
        background: 'rgba(0, 255, 0, 0.2)', // Green background to see the container
        border: '2px solid blue' // Blue border to make it visible
      }}
    >
      <VFXDiv
        shader="rgbShift"
        style={{
          width: '100%',
          height: '100%',
          background: 'rgba(255, 0, 255, 0.3)', // Magenta background to see VFXDiv
          border: '2px solid yellow' // Yellow border to make VFXDiv visible
        }}
      >
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: 'white',
          fontSize: '24px',
          fontWeight: 'bold',
          textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
        }}>
          VFX DIV ACTIVE
        </div>
      </VFXDiv>
    </div>
  )
}

export default TestVFXOverlay 