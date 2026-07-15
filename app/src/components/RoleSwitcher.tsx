'use client'

import { useRouter } from 'next/navigation'

export default function RoleSwitcher({ targetUrl, label, className }: { targetUrl: string, label: string, className?: string }) {
  const router = useRouter()
  return (
    <button
      onClick={() => router.push(targetUrl)}
      className={className || "flex items-center justify-center gap-2 text-[color:var(--color-primary)] hover:bg-[color:var(--color-primary)]/10 px-3 py-2 rounded-lg transition-colors font-bold text-sm"}
      title={label}
    >
      <span className="material-symbols-outlined text-[20px]">swap_horiz</span>
      <span className="hidden md:inline">{label}</span>
    </button>
  )
}
