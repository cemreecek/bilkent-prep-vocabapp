"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeleteClassroomButton({ classroomId }: { classroomId: string }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this classroom?")) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/classrooms/${classroomId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        router.refresh();
      } else {
        alert("Failed to delete classroom");
      }
    } catch (error) {
      console.error(error);
      alert("An error occurred");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className="p-2 text-[color:var(--color-error)] hover:bg-[color:var(--color-error)]/10 transition-colors border border-[color:var(--color-outline-variant)] rounded-lg disabled:opacity-50"
      title="Delete Classroom"
    >
      <span className="material-symbols-outlined text-sm">
        {isDeleting ? "hourglass_empty" : "delete"}
      </span>
    </button>
  );
}
