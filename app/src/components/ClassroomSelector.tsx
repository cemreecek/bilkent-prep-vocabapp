"use client";

import React from "react";
import { useRouter } from "next/navigation";

export default function ClassroomSelector({
  classrooms,
  selectedId,
}: {
  classrooms: { id: string; name: string }[];
  selectedId: string;
}) {
  const router = useRouter();

  if (classrooms.length <= 1) {
    return (
      <span className="text-[color:var(--color-primary)] font-bold">
        {classrooms[0]?.name || "Dashboard"}
      </span>
    );
  }

  return (
    <div className="relative inline-flex items-center">
      <select
        value={selectedId}
        onChange={(e) => router.push(`?classroomId=${e.target.value}`)}
        className="appearance-none bg-[color:var(--color-primary-container)] border border-[color:var(--color-outline-variant)] text-[color:var(--color-on-primary-container)] font-bold focus:ring-2 focus:ring-[color:var(--color-primary)] outline-none cursor-pointer text-xs rounded-md pl-3 pr-8 py-1 transition-colors"
      >
        {classrooms.map((c) => (
          <option key={c.id} value={c.id} className="text-black dark:text-white bg-white dark:bg-gray-800">
            {c.name}
          </option>
        ))}
      </select>
      <span className="material-symbols-outlined absolute right-2 text-[16px] text-[color:var(--color-on-primary-container)] pointer-events-none">
        arrow_drop_down
      </span>
    </div>
  );
}
