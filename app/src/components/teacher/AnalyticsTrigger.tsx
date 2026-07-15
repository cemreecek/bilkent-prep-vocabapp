'use client'

import React, { useState } from 'react'
import AnalyticsModal from './AnalyticsModal'

interface AnalyticsTriggerProps {
  roster: any[]
  topErrors: { word: string, count: number }[]
}

export default function AnalyticsTrigger({ roster, topErrors }: AnalyticsTriggerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <div 
        onClick={() => setIsModalOpen(true)}
        className="bg-[color:var(--color-primary)] p-6 rounded-xl border border-[color:var(--color-primary)] hover:opacity-90 active:scale-95 transition-all cursor-pointer shadow-sm flex flex-col justify-center text-[color:var(--color-on-primary)] group"
      >
        <div className="flex items-center justify-between mb-2">
          <p className="font-[family-name:var(--font-label-sm)] uppercase tracking-widest font-bold">
            Class Performance
          </p>
          <span className="material-symbols-outlined group-hover:scale-110 transition-transform">
            query_stats
          </span>
        </div>
        <p className="text-[length:var(--text-title-lg)] font-bold mt-2">
          View Detailed Analytics
        </p>
        <div className="mt-4 flex items-center gap-2 text-sm opacity-90">
          <span>Weekly Points & Error Debt</span>
          <span className="material-symbols-outlined text-sm translate-x-0 group-hover:translate-x-2 transition-transform">arrow_forward</span>
        </div>
      </div>

      <AnalyticsModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        students={roster}
        topErrors={topErrors}
      />
    </>
  )
}
