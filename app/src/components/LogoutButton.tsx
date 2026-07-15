'use client'

import { signOut } from 'next-auth/react'

export default function LogoutButton({ className }: { className?: string }) {
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/auth/signin' })}
      className={className || "flex items-center justify-center gap-2 text-[color:var(--color-error)] hover:bg-[color:var(--color-error)]/10 px-3 py-2 rounded-lg transition-colors font-bold text-sm"}
      title="Log out"
    >
      <span className="material-symbols-outlined text-[20px]">logout</span>
      <span className="hidden md:inline">Logout</span>
    </button>
  )
}
