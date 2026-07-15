'use client'

import { useEffect, useState, useRef } from 'react'

interface AntiCheatWrapperProps {
  children: React.ReactNode
  onCheatAttempt?: (type: string) => void
  strictMode?: boolean
}

export default function AntiCheatWrapper({ children, onCheatAttempt, strictMode = true }: AntiCheatWrapperProps) {
  const [warningMessage, setWarningMessage] = useState<string | null>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!strictMode) return

    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault()
      onCheatAttempt?.('copy')
      showWarning("Copying is disabled in Strict Mode")
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        onCheatAttempt?.('tab_switch')
        showWarning("Tab switching is monitored during practice!")
      }
    }

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault()
    }

    const element = wrapperRef.current
    if (element) {
      element.addEventListener('copy', handleCopy)
      element.addEventListener('contextmenu', handleContextMenu)
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      if (element) {
        element.removeEventListener('copy', handleCopy)
        element.removeEventListener('contextmenu', handleContextMenu)
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [strictMode, onCheatAttempt])

  const showWarning = (msg: string) => {
    setWarningMessage(msg)
    setTimeout(() => setWarningMessage(null), 4000)
  }

  return (
    <div ref={wrapperRef} className="relative w-full">
      {warningMessage && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-error text-on-error px-6 py-3 rounded-full font-label-md text-sm shadow-xl animate-bounce z-50 whitespace-nowrap">
          <span className="material-symbols-outlined align-middle mr-2 text-lg">warning</span>
          {warningMessage}
        </div>
      )}
      <div className={strictMode ? "protected-content select-none" : ""}>
        {children}
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        .protected-content {
            user-select: none !important;
            -webkit-user-select: none !important;
        }
        .protected-content input, .protected-content textarea {
            user-select: text !important;
            -webkit-user-select: text !important;
        }
      `}} />
    </div>
  )
}
