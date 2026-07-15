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
    <select
      value={selectedId}
      onChange={(e) => router.push(`?classroomId=${e.target.value}`)}
      className="bg-transparent border-none text-[color:var(--color-primary)] font-bold focus:ring-0 outline-none cursor-pointer hover:underline text-xs m-0 p-0"
    >
      {classrooms.map((c) => (
        <option key={c.id} value={c.id} className="text-black dark:text-white">
          {c.name}
        </option>
      ))}
    </select>
  );
}
