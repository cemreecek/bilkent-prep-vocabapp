'use client'

import React, { useState, useMemo } from 'react'

interface AnalyticsStudent {
  id: string
  name: string
  streak: number
  debt: number
  points: number
}

interface AnalyticsModalProps {
  isOpen: boolean
  onClose: () => void
  students: AnalyticsStudent[]
  topErrors: { word: string, count: number }[]
}

export default function AnalyticsModal({ isOpen, onClose, students, topErrors }: AnalyticsModalProps) {
  const [activeTab, setActiveTab] = useState<'performance' | 'errors'>('performance')
  
  const sortedByPoints = useMemo(() => {
    return [...students].sort((a, b) => b.points - a.points)
  }, [students])

  const sortedByDebt = useMemo(() => {
    return [...students].sort((a, b) => b.debt - a.debt)
  }, [students])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-[color:var(--color-surface)] w-full max-w-4xl h-[80vh] rounded-3xl shadow-xl overflow-hidden border border-[color:var(--color-outline-variant)] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-[color:var(--color-outline-variant)] bg-[color:var(--color-surface-container-low)] flex justify-between items-center shrink-0">
          <h2 className="font-[family-name:var(--font-headline-sm)] text-[length:var(--text-headline-sm)] text-[color:var(--color-primary)] font-bold flex items-center gap-3">
            <span className="material-symbols-outlined text-3xl">query_stats</span>
            Class Analytics & Performance
          </h2>
          <button onClick={onClose} className="material-symbols-outlined text-[color:var(--color-on-surface-variant)] hover:text-[color:var(--color-error)] transition-colors text-2xl">
            close
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[color:var(--color-outline-variant)] shrink-0 bg-[color:var(--color-surface-container-lowest)]">
          <button 
            onClick={() => setActiveTab('performance')}
            className={`flex-1 py-4 font-bold tracking-widest uppercase text-xs transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'performance' 
                ? 'border-b-2 border-[color:var(--color-primary)] text-[color:var(--color-primary)] bg-[color:var(--color-primary)]/5' 
                : 'text-[color:var(--color-on-surface-variant)] hover:bg-[color:var(--color-surface-container-low)]'
            }`}
          >
            <span className="material-symbols-outlined text-sm">leaderboard</span>
            Weekly Points
          </button>
          <button 
            onClick={() => setActiveTab('errors')}
            className={`flex-1 py-4 font-bold tracking-widest uppercase text-xs transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'errors' 
                ? 'border-b-2 border-[color:var(--color-primary)] text-[color:var(--color-primary)] bg-[color:var(--color-primary)]/5' 
                : 'text-[color:var(--color-on-surface-variant)] hover:bg-[color:var(--color-surface-container-low)]'
            }`}
          >
            <span className="material-symbols-outlined text-sm">trending_up</span>
            Error Debt Analysis
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-[color:var(--color-surface-container-lowest)]">
          
          {activeTab === 'performance' && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-[color:var(--color-primary-container)] p-4 rounded-xl flex items-center gap-4">
                <span className="material-symbols-outlined text-3xl text-[color:var(--color-on-primary-container)]">info</span>
                <p className="text-sm text-[color:var(--color-on-primary-container)]">
                  <strong>How points are calculated:</strong> Students can earn up to <strong>10 points per week</strong>. 
                  They get up to 5 points for maintaining daily streaks, and up to 5 points for keeping their Error Debt low. Fast, "non-human" answers increase error debt.
                </p>
              </div>

              <div className="grid gap-3">
                {sortedByPoints.map((student, idx) => (
                  <div key={student.id} className="flex items-center justify-between p-4 bg-[color:var(--color-surface-container-low)] rounded-xl border border-[color:var(--color-outline-variant)]">
                    <div className="flex items-center gap-4">
                      <div className="font-bold text-[color:var(--color-on-surface-variant)] w-6 text-center">#{idx + 1}</div>
                      <div className="w-10 h-10 rounded-full bg-[color:var(--color-primary-fixed-dim)] text-[color:var(--color-primary)] flex items-center justify-center font-bold text-sm">
                        {student.name.substring(0,2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-[color:var(--color-on-surface)]">{student.name}</div>
                        <div className="text-xs text-[color:var(--color-on-surface-variant)] flex gap-3 mt-1">
                          <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">local_fire_department</span> {student.streak} Streak</span>
                          <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">trending_up</span> {student.debt} Debt</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <div className="text-2xl font-bold text-[color:var(--color-primary)]">{student.points}<span className="text-sm text-[color:var(--color-on-surface-variant)]">/10</span></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'errors' && (
            <div className="space-y-8 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Most Common Errors */}
                <div className="bg-[color:var(--color-surface-container-low)] p-6 rounded-xl border border-[color:var(--color-outline-variant)]">
                  <h3 className="font-bold text-[color:var(--color-primary)] flex items-center gap-2 mb-6">
                    <span className="material-symbols-outlined">warning</span>
                    Class-wide Focus Areas
                  </h3>
                  <div className="space-y-4">
                    {topErrors.length > 0 ? (
                      topErrors.map((err, index) => {
                        const maxCount = topErrors[0].count;
                        const percentage = Math.max(10, (err.count / maxCount) * 100);
                        return (
                          <div key={err.word} className="space-y-2">
                            <div className="flex justify-between items-center text-sm">
                              <span className="font-bold text-[color:var(--color-on-surface)]">"{err.word}"</span>
                              <span className="text-[color:var(--color-error)] font-bold">{err.count} Mistakes</span>
                            </div>
                            <div className="w-full bg-[color:var(--color-surface-container)] h-2 rounded-full overflow-hidden">
                              <div className="bg-[color:var(--color-error)] h-full" style={{ width: `${percentage}%` }}></div>
                            </div>
                          </div>
                        )
                      })
                    ) : (
                      <p className="text-sm text-[color:var(--color-on-surface-variant)] italic">No class-wide errors recorded yet.</p>
                    )}
                  </div>
                </div>

                {/* Highest Debt Students */}
                <div className="bg-[color:var(--color-surface-container-low)] p-6 rounded-xl border border-[color:var(--color-outline-variant)]">
                  <h3 className="font-bold text-[color:var(--color-primary)] flex items-center gap-2 mb-6">
                    <span className="material-symbols-outlined">person_alert</span>
                    Highest Individual Debt
                  </h3>
                  <div className="space-y-3">
                    {sortedByDebt.slice(0, 5).map((student) => (
                      <div key={student.id} className="flex justify-between items-center p-3 bg-[color:var(--color-surface-container-lowest)] rounded-lg">
                        <span className="font-bold text-sm text-[color:var(--color-on-surface)]">{student.name}</span>
                        {student.debt > 0 ? (
                          <span className="text-xs font-bold text-[color:var(--color-error)] px-2 py-1 bg-[color:var(--color-error-container)] rounded-lg">
                            {student.debt} Mistakes
                          </span>
                        ) : (
                          <span className="text-xs font-bold text-green-700 px-2 py-1 bg-green-100 rounded-lg">
                            Clear
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
