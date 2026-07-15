"use client";

import React, { useState } from "react";
import { editClassroomNameAction } from "@/app/actions/classroom";

export default function AdminClassroomNameEditor({
  classroomId,
  initialName,
}: {
  classroomId: string;
  initialName: string;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(initialName);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (name.trim() === initialName || !name.trim()) {
      setIsEditing(false);
      setName(initialName); // reset
      return;
    }
    
    setLoading(true);
    const result = await editClassroomNameAction(classroomId, name);
    if (result.success) {
      setIsEditing(false);
      window.location.reload(); // Quick refresh to update the page state
    } else {
      alert(result.error);
    }
    setLoading(false);
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-2 h-8 bg-[color:var(--color-primary)] rounded-full hidden sm:block"></div>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={loading}
          className="border border-[color:var(--color-primary)] rounded px-2 py-1 text-sm bg-[color:var(--color-surface)] text-[color:var(--color-on-surface)] focus:outline-none w-32 sm:w-48"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSave();
            if (e.key === "Escape") {
              setIsEditing(false);
              setName(initialName);
            }
          }}
        />
        <button
          onClick={handleSave}
          disabled={loading}
          className="p-1 rounded hover:bg-[color:var(--color-primary-container)] text-[color:var(--color-primary)] transition-colors flex items-center justify-center"
          title="Save"
        >
          <span className="material-symbols-outlined text-[18px]">check</span>
        </button>
        <button
          onClick={() => {
            setIsEditing(false);
            setName(initialName);
          }}
          disabled={loading}
          className="p-1 rounded hover:bg-[color:var(--color-error-container)] text-[color:var(--color-error)] transition-colors flex items-center justify-center"
          title="Cancel"
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 group/edit">
      <div className="w-2 h-8 bg-[color:var(--color-primary)] rounded-full"></div>
      <span className="font-[family-name:var(--font-body-md)] font-bold text-[color:var(--color-primary)]">
        {initialName}
      </span>
      <button
        onClick={() => setIsEditing(true)}
        className="opacity-0 group-hover/edit:opacity-100 p-1 text-[color:var(--color-on-surface-variant)] hover:text-[color:var(--color-primary)] transition-all bg-[color:var(--color-surface-container-highest)] rounded"
        title="Edit Name"
      >
        <span className="material-symbols-outlined text-[16px] block">edit</span>
      </button>
    </div>
  );
}
