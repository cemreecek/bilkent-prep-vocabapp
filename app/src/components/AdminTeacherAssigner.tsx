"use client";

import React, { useState } from "react";
import { assignTeacherToClassroomAction } from "@/app/actions/classroom";

export default function AdminTeacherAssigner({
  classroomId,
  currentTeacherId,
  teachers,
}: {
  classroomId: string;
  currentTeacherId: string | null;
  teachers: { id: string; name: string | null }[];
}) {
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState(currentTeacherId || "");

  const handleAssign = async (newId: string) => {
    if (newId === selectedId) return;
    setLoading(true);
    setSelectedId(newId);
    const res = await assignTeacherToClassroomAction(classroomId, newId);
    if (res.success) {
      window.location.reload();
    } else {
      alert(res.error);
      setSelectedId(currentTeacherId || "");
    }
    setLoading(false);
  };

  return (
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 rounded-full bg-[color:var(--color-primary-fixed-dim)] flex items-center justify-center font-bold text-[color:var(--color-primary)] text-xs shrink-0">
        {teachers.find((t) => t.id === selectedId)?.name?.substring(0, 2).toUpperCase() || "U"}
      </div>
      <select
        value={selectedId}
        onChange={(e) => handleAssign(e.target.value)}
        disabled={loading}
        className="bg-[color:var(--color-surface)] border border-[color:var(--color-outline-variant)] rounded-lg text-sm px-2 py-1 focus:ring-0 focus:border-[color:var(--color-primary)] outline-none cursor-pointer max-w-[120px] md:max-w-[160px] truncate disabled:opacity-50"
      >
        <option value="" disabled>Select Teacher</option>
        {teachers.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name || "Unknown Teacher"}
          </option>
        ))}
      </select>
    </div>
  );
}
