'use client'

import React, { useState } from 'react'

interface StudentData {
  id: string
  name: string
  email: string
}

interface EditStudentModalProps {
  student: StudentData | null
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function EditStudentModal({ student, isOpen, onClose, onSuccess }: EditStudentModalProps) {
  const [name, setName] = useState(student?.name || '')
  const [email, setEmail] = useState(student?.email || '')
  const [newPassword, setNewPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Update state if student prop changes
  React.useEffect(() => {
    if (student) {
      setName(student.name || '')
      setEmail(student.email || '')
      setNewPassword('')
      setError('')
    }
  }, [student])

  if (!isOpen || !student) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    try {
      const res = await fetch(`/api/teacher/students/${student.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, newPassword })
      })

      if (!res.ok) {
        throw new Error('Failed to update student')
      }

      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-[color:var(--color-surface-container-lowest)] w-full max-w-md rounded-3xl shadow-xl overflow-hidden border border-[color:var(--color-outline-variant)]">
        <div className="p-6 border-b border-[color:var(--color-outline-variant)] flex justify-between items-center bg-[color:var(--color-surface-container-low)]">
          <h2 className="font-[family-name:var(--font-title-lg)] text-[length:var(--text-title-lg)] text-[color:var(--color-primary)] font-bold flex items-center gap-2">
            <span className="material-symbols-outlined">edit</span>
            Edit Student
          </h2>
          <button onClick={onClose} className="material-symbols-outlined text-[color:var(--color-on-surface-variant)] hover:text-[color:var(--color-error)] transition-colors">
            close
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-[color:var(--color-error-container)] text-[color:var(--color-on-error-container)] rounded-xl text-sm font-bold">
              {error}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-bold text-[color:var(--color-on-surface-variant)] uppercase tracking-widest">Full Name</label>
            <input 
              type="text" 
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-3 rounded-xl border border-[color:var(--color-outline-variant)] bg-[color:var(--color-surface-container-lowest)] focus:border-[color:var(--color-primary)] focus:ring-1 focus:ring-[color:var(--color-primary)] outline-none transition-all"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-[color:var(--color-on-surface-variant)] uppercase tracking-widest">Email Address</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 rounded-xl border border-[color:var(--color-outline-variant)] bg-[color:var(--color-surface-container-lowest)] focus:border-[color:var(--color-primary)] focus:ring-1 focus:ring-[color:var(--color-primary)] outline-none transition-all"
            />
          </div>

          <div className="space-y-1 pt-2">
            <label className="text-xs font-bold text-[color:var(--color-on-surface-variant)] uppercase tracking-widest">Reset Password (Optional)</label>
            <input 
              type="password" 
              placeholder="Leave blank to keep current password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full p-3 rounded-xl border border-[color:var(--color-outline-variant)] bg-[color:var(--color-surface-container-lowest)] focus:border-[color:var(--color-primary)] focus:ring-1 focus:ring-[color:var(--color-primary)] outline-none transition-all"
            />
            <p className="text-[10px] text-[color:var(--color-on-surface-variant)] mt-1">
              If a student is locked out, you can set a new password here.
            </p>
          </div>

          <div className="pt-6 flex justify-end gap-3">
            <button 
              type="button" 
              onClick={onClose}
              className="px-5 py-2 rounded-full font-bold text-[color:var(--color-on-surface-variant)] hover:bg-[color:var(--color-surface-container)] transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="px-6 py-2 rounded-full font-bold bg-[color:var(--color-primary)] text-[color:var(--color-on-primary)] hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
