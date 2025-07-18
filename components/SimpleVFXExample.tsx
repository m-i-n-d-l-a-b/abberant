import React, { useState } from 'react'
import { VFXProvider, VFXImg, VFXSpan, VFXDiv } from 'react-vfx'

const SimpleVFXExample: React.FC = () => {
  const [selectedShader, setSelectedShader] = useState('rgbShift')

  return (
    <VFXProvider>
      <div style={{ 
        padding: '20px', 
        background: '#0a0a0a', 
        color: 'white',
        fontFamily: 'Arial, sans-serif'
      }}>
        <h2>React-VFX Examples</h2>
        
        <div style={{ marginBottom: '20px' }}>
          <label>Select Shader: </label>
          <select 
            value={selectedShader} 
            onChange={(e) => setSelectedShader(e.target.value)}
            style={{ marginLeft: '10px', padding: '5px' }}
          >
            <option value="rgbShift">RGB Shift</option>
            <option value="pixelate">Pixelate</option>
            <option value="halftone">Halftone</option>
            <option value="rainbow">Rainbow</option>
            <option value="custom">Custom Glitch</option>
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          
          {/* Image with VFX */}
          <div style={{ background: 'rgba(255,255,255,0.1)', padding: '15px', borderRadius: '8px' }}>
            <h3>Image with VFX</h3>
            <VFXImg
              src="https://via.placeholder.com/300x200/00ffff/000000?text=Game+Element"
              alt="Game element with VFX"
              shader={selectedShader === 'custom' ? `
                uniform float time;
                uniform vec2 resolution;
                
                void mainImage(out vec4 fragColor, in vec2 fragCoord) {
                  vec2 uv = fragCoord / resolution;
                  
                  // Custom glitch effect
                  float glitch = sin(time * 5.0) * 0.1;
                  uv.x += glitch * sin(uv.y * 10.0);
                  
                  vec4 color = texture2D(iChannel0, uv);
                  fragColor = color;
                }
              ` : selectedShader}
              style={{ width: '100%', height: 'auto' }}
            />
          </div>

          {/* Text with VFX */}
          <div style={{ background: 'rgba(255,255,255,0.1)', padding: '15px', borderRadius: '8px' }}>
            <h3>Text with VFX</h3>
            <VFXSpan
              shader={selectedShader}
              style={{ 
                fontSize: '24px', 
                fontWeight: 'bold',
                display: 'block',
                textAlign: 'center',
                padding: '20px'
              }}
            >
              Trippy Text Effect!
            </VFXSpan>
          </div>

          {/* Container with VFX */}
          <div style={{ background: 'rgba(255,255,255,0.1)', padding: '15px', borderRadius: '8px' }}>
            <h3>Container with VFX</h3>
            <VFXDiv
              shader={selectedShader}
              style={{
                padding: '20px',
                border: '2px solid #00ffff',
                borderRadius: '8px',
                textAlign: 'center'
              }}
            >
              <p>This entire container has VFX applied!</p>
              <button style={{ 
                background: '#00ffff', 
                color: '#000', 
                border: 'none', 
                padding: '10px 20px',
                borderRadius: '5px',
                cursor: 'pointer'
              }}>
                Interactive Button
              </button>
            </VFXDiv>
          </div>

        </div>

        <div style={{ 
          marginTop: '30px', 
          background: 'rgba(255,255,255,0.1)', 
          padding: '20px', 
          borderRadius: '8px' 
        }}>
          <h3>How to Use react-vfx</h3>
          <ul>
            <li><strong>VFXImg:</strong> Apply effects to images (supports GIFs and videos too!)</li>
            <li><strong>VFXSpan:</strong> Apply effects to text content</li>
            <li><strong>VFXDiv:</strong> Apply effects to any HTML content</li>
            <li><strong>Built-in shaders:</strong> rgbShift, pixelate, halftone, rainbow</li>
            <li><strong>Custom shaders:</strong> Write your own GLSL shaders</li>
          </ul>
        </div>
      </div>
    </VFXProvider>
  )
}

export default SimpleVFXExample 