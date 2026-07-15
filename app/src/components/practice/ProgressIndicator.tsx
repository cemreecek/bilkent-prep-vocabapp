'use client'

interface ProgressIndicatorProps {
  current: number
  total: number
}

export default function ProgressIndicator({ current, total }: ProgressIndicatorProps) {
  const percentage = Math.round((current / total) * 100) || 0

  return (
    <div className="w-full mb-section-gap">
      <div className="flex justify-between items-end mb-2">
        <span className="font-label-sm text-label-sm text-on-surface-variant">
          Question {current} of {total}
        </span>
        <span className="font-label-sm text-label-sm text-primary font-bold">
          {percentage}%
        </span>
      </div>
      <div className="h-2 w-full bg-surface-container-high rounded-full overflow-hidden">
        <div
          className="h-full bg-primary-container rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  )
}
