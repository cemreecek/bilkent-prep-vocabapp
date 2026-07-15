"use client";
import React, { useState } from "react";
import { joinClassroomAction } from "@/app/actions/classroom";

export default function JoinClassroom() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleJoin = async () => {
    if (!code.trim()) return;
    setLoading(true);
    setError("");
    const result = await joinClassroomAction(code);
    if (result.success) {
      window.location.reload();
    } else {
      setError(result.error || "Failed to join");
      setLoading(false);
    }
  };

  return (
    <div className="bg-[color:var(--color-surface-container-lowest)] p-6 rounded-xl border border-[color:var(--color-outline-variant)] shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        <span className="material-symbols-outlined text-[color:var(--color-primary)]">group_add</span>
        <h3 className="font-[family-name:var(--font-title-md)] text-[color:var(--color-primary)] font-bold">
          Join a Classroom
        </h3>
      </div>
      <p className="text-[color:var(--color-on-surface-variant)] text-sm mb-4 font-[family-name:var(--font-body-md)]">
        Ask your instructor for your section's Join Code to link your practice progress to your class roster.
      </p>
      <div className="flex gap-3">
        <input 
          value={code} 
          onChange={(e) => setCode(e.target.value)} 
          placeholder="e.g. clxw2..." 
          className="flex-1 px-4 py-2 border border-[color:var(--color-outline-variant)] rounded-xl bg-[color:var(--color-surface)] text-[color:var(--color-on-surface)] focus:ring-2 focus:ring-[color:var(--color-primary)] focus:outline-none font-mono"
          onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
        />
        <button 
          onClick={handleJoin} 
          disabled={loading || !code.trim()} 
          className="bg-[color:var(--color-primary)] text-[color:var(--color-on-primary)] px-6 py-2 rounded-xl font-bold disabled:opacity-50 hover:opacity-90 transition-opacity flex items-center justify-center min-w-[100px]"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : "Enroll"}
        </button>
      </div>
      {error && (
        <div className="mt-3 flex items-center gap-1 text-[color:var(--color-error)] text-sm font-medium">
          <span className="material-symbols-outlined text-sm">error</span>
          {error}
        </div>
      )}
    </div>
  );
}
