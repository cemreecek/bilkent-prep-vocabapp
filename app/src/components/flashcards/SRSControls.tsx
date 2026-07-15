'use client'

interface SRSControlsProps {
  onRate: (quality: number) => void
  disabled?: boolean
}

export default function SRSControls({ onRate, disabled = false }: SRSControlsProps) {
  return (
    <div className="w-full max-w-lg mx-auto mt-8 grid grid-cols-4 gap-2 md:gap-4">
      <button 
        disabled={disabled}
        onClick={() => onRate(0)}
        className="flex flex-col items-center p-3 rounded-xl border border-error/30 bg-error-container/10 hover:bg-error-container/30 transition-colors disabled:opacity-50 group"
      >
        <span className="font-label-sm text-error font-bold mb-1 group-hover:-translate-y-1 transition-transform">Again</span>
        <span className="text-[10px] text-error/70">1 min</span>
      </button>
      
      <button 
        disabled={disabled}
        onClick={() => onRate(2)}
        className="flex flex-col items-center p-3 rounded-xl border border-outline-variant bg-surface-container hover:bg-surface-variant transition-colors disabled:opacity-50 group"
      >
        <span className="font-label-sm text-on-surface-variant font-bold mb-1 group-hover:-translate-y-1 transition-transform">Hard</span>
        <span className="text-[10px] text-outline">10 min</span>
      </button>

      <button 
        disabled={disabled}
        onClick={() => onRate(4)}
        className="flex flex-col items-center p-3 rounded-xl border border-primary/30 bg-primary-container/10 hover:bg-primary-container/30 transition-colors disabled:opacity-50 group"
      >
        <span className="font-label-sm text-primary font-bold mb-1 group-hover:-translate-y-1 transition-transform">Good</span>
        <span className="text-[10px] text-primary/70">1 day</span>
      </button>

      <button 
        disabled={disabled}
        onClick={() => onRate(5)}
        className="flex flex-col items-center p-3 rounded-xl border border-green-500/30 bg-green-50 hover:bg-green-100 transition-colors disabled:opacity-50 group"
      >
        <span className="font-label-sm text-green-700 font-bold mb-1 group-hover:-translate-y-1 transition-transform">Easy</span>
        <span className="text-[10px] text-green-600/70">4 days</span>
      </button>
    </div>
  )
}
