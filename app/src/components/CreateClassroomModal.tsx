"use client";

import React, { useState } from "react";
import { createClassroomAction } from "@/app/actions/classroom";

export default function CreateClassroomModal({
  teachers,
}: {
  teachers: { id: string; name: string | null }[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [level, setLevel] = useState("Elementary");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Classroom name is required");
      return;
    }

    setLoading(true);
    setError("");
    const res = await createClassroomAction(name, teacherId, level);
    if (res.success) {
      setIsOpen(false);
      setName("");
      setTeacherId("");
      setLevel("Elementary");
      window.location.reload();
    } else {
      setError(res.error || "Failed to create classroom");
    }
    setLoading(false);
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="bg-[color:var(--color-primary)] text-[color:var(--color-on-primary)] px-6 py-3 rounded-xl font-[family-name:var(--font-label-sm)] flex items-center gap-2 active:scale-95 transition-transform"
      >
        <span className="material-symbols-outlined text-sm">add</span>
        Create New Classroom
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 text-left">
          <div className="bg-[color:var(--color-surface-container-lowest)] border border-[color:var(--color-outline-variant)] rounded-2xl w-full max-w-md p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-[family-name:var(--font-title-md)] text-[length:var(--text-title-md)] font-bold text-[color:var(--color-primary)]">
                Create New Classroom
              </h3>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-[color:var(--color-on-surface-variant)] hover:bg-[color:var(--color-surface-container-high)] p-2 rounded-full transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-[family-name:var(--font-label-sm)] text-[color:var(--color-on-surface-variant)] mb-1">
                  Classroom Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. PREP 101-B"
                  className="w-full border border-[color:var(--color-outline-variant)] rounded-xl px-4 py-3 bg-[color:var(--color-surface)] text-[color:var(--color-on-surface)] focus:ring-0 focus:border-[color:var(--color-primary)] outline-none"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-[family-name:var(--font-label-sm)] text-[color:var(--color-on-surface-variant)] mb-1">
                  Curriculum Level
                </label>
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  className="w-full border border-[color:var(--color-outline-variant)] rounded-xl px-4 py-3 bg-[color:var(--color-surface)] text-[color:var(--color-on-surface)] focus:ring-0 focus:border-[color:var(--color-primary)] outline-none"
                >
                  <option value="Elementary">Elementary</option>
                  <option value="PreIntermediate">Pre-Intermediate</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="UpperIntermediate">Upper-Intermediate</option>
                  <option value="PreFac">Pre-Faculty</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-[family-name:var(--font-label-sm)] text-[color:var(--color-on-surface-variant)] mb-1">
                  Assign Initial Teacher (Optional)
                </label>
                <select
                  value={teacherId}
                  onChange={(e) => setTeacherId(e.target.value)}
                  className="w-full border border-[color:var(--color-outline-variant)] rounded-xl px-4 py-3 bg-[color:var(--color-surface)] text-[color:var(--color-on-surface)] focus:ring-0 focus:border-[color:var(--color-primary)] outline-none"
                >
                  <option value="">-- No Teacher Assigned --</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>{t.name || "Unknown Teacher"}</option>
                  ))}
                </select>
              </div>

              {error && <div className="text-[color:var(--color-error)] text-sm">{error}</div>}

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-[color:var(--color-outline-variant)] text-[color:var(--color-on-surface-variant)] hover:bg-[color:var(--color-surface-container-high)] transition-colors font-[family-name:var(--font-label-sm)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 rounded-xl bg-[color:var(--color-primary)] text-[color:var(--color-on-primary)] hover:opacity-90 transition-opacity disabled:opacity-50 font-[family-name:var(--font-label-sm)]"
                >
                  {loading ? "Creating..." : "Create Classroom"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
