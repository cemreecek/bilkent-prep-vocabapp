'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { signOut } from 'next-auth/react'

export default function AdminMobileDrawer() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <span 
        className="md:hidden material-symbols-outlined text-[color:var(--color-primary)] cursor-pointer"
        onClick={() => setIsOpen(true)}
      >
        menu
      </span>

      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-[100] md:hidden transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sliding Drawer */}
      <div 
        className={`fixed top-0 left-0 h-full w-72 bg-[color:var(--color-surface)] z-[110] transform transition-transform duration-300 md:hidden flex flex-col shadow-2xl ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="px-6 py-6 flex flex-col items-start border-b border-[color:var(--color-outline-variant)] relative">
          <button 
            className="absolute top-4 right-4 text-[color:var(--color-on-surface-variant)]"
            onClick={() => setIsOpen(false)}
          >
            <span className="material-symbols-outlined">close</span>
          </button>
          
          <div className="flex items-center gap-3 mb-6">
            <img
              alt="Campus Vocab Logo"
              className="w-10 h-10 rounded-full"
              src="/logo.jpg"
            />
            <div>
              <h1 className="font-[family-name:var(--font-headline-sm)] text-[color:var(--color-primary)] font-bold">
                Instructor Portal
              </h1>
              <p className="text-xs text-[color:var(--color-on-surface-variant)]">
                Campus Vocab
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-2 py-4 overflow-y-auto">
          <Link 
            href="/admin" 
            className="flex items-center text-[color:var(--color-primary)] font-bold border-l-4 border-[color:var(--color-primary)] pl-4 py-3 mb-1"
            onClick={() => setIsOpen(false)}
          >
            <span className="material-symbols-outlined mr-3">grid_view</span>
            <span>Overview</span>
          </Link>

          <Link 
            href="/admin/users" 
            className="flex items-center text-[color:var(--color-on-surface-variant)] pl-5 py-3 mb-1"
            onClick={() => setIsOpen(false)}
          >
            <span className="material-symbols-outlined mr-3">group</span>
            <span>User Management</span>
          </Link>
        </nav>

        <div className="mt-auto px-4 py-4 border-t border-[color:var(--color-outline-variant)]">
          <button 
            onClick={() => signOut({ callbackUrl: '/auth/signin' })}
            className="flex items-center gap-2 text-[color:var(--color-error)] hover:bg-[color:var(--color-error)]/10 px-4 py-2 rounded-xl transition-colors font-bold text-sm w-full"
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
            Logout
          </button>
        </div>
      </div>
    </>
  )
}
