import OptimizedGameWithVFX from '@/components/OptimizedGameWithVFX'

export default function Home() {
  return (
    <main>
      <OptimizedGameWithVFX 
        initialVFXEnabled={false}
        initialEffect="glitch"
        initialIntensity={1.0}
        initialQuality="auto"
      />
    </main>
  )
} 