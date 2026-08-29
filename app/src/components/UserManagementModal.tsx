"use client";

import React, { useState } from "react";
import { adminCreateUserAction, adminUpdateUserAction } from "@/app/actions/user";

export default function UserManagementModal({
  user,
}: {
  user?: { id: string; name: string | null; email: string; role: string; level?: string | null };
}) {
  const isEditing = !!user;
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [role, setRole] = useState(user?.role || "STUDENT");
  const [level, setLevel] = useState(user?.level || "");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (isEditing) {
      const res = await adminUpdateUserAction(user.id, {
        name, email, role, level: level || undefined, password: password || undefined
      });
      if (res.success) {
        setIsOpen(false);
        window.location.reload();
      } else {
        setError(res.error || "Failed to update user");
      }
    } else {
      const res = await adminCreateUserAction({ name, email, role, level: level || undefined, password });
      if (res.success) {
        setIsOpen(false);
        window.location.reload();
      } else {
        setError(res.error || "Failed to create user");
      }
    }
    setLoading(false);
  };

  return (
    <>
      {isEditing ? (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-[color:var(--color-surface-container-high)] text-[color:var(--color-on-surface-variant)] px-4 py-2 rounded-xl font-[family-name:var(--font-label-sm)] flex items-center gap-2 hover:bg-[color:var(--color-surface-container-highest)] hover:text-[color:var(--color-primary)] transition-all ml-auto"
          title="Change Role / Edit"
        >
          <span className="material-symbols-outlined text-sm">manage_accounts</span>
          Change Role / Edit
        </button>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-[color:var(--color-primary)] text-[color:var(--color-on-primary)] px-6 py-3 rounded-xl font-[family-name:var(--font-label-sm)] flex items-center gap-2 active:scale-95 transition-transform"
        >
          <span className="material-symbols-outlined text-sm">person_add</span>
          Create New User
        </button>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-[color:var(--color-surface-container-lowest)] border border-[color:var(--color-outline-variant)] rounded-2xl w-full max-w-md p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-[family-name:var(--font-title-md)] text-[length:var(--text-title-md)] font-bold text-[color:var(--color-primary)]">
                {isEditing ? "Edit User" : "Create New User"}
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-[color:var(--color-on-surface-variant)] hover:bg-[color:var(--color-surface-container-high)] p-2 rounded-full transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-left">
              <div>
                <label className="block text-sm font-[family-name:var(--font-label-sm)] text-[color:var(--color-on-surface-variant)] mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-[color:var(--color-outline-variant)] rounded-xl px-4 py-3 bg-[color:var(--color-surface)] text-[color:var(--color-on-surface)] focus:ring-0 focus:border-[color:var(--color-primary)] outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-[family-name:var(--font-label-sm)] text-[color:var(--color-on-surface-variant)] mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-[color:var(--color-outline-variant)] rounded-xl px-4 py-3 bg-[color:var(--color-surface)] text-[color:var(--color-on-surface)] focus:ring-0 focus:border-[color:var(--color-primary)] outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-[family-name:var(--font-label-sm)] text-[color:var(--color-on-surface-variant)] mb-1">
                  Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full border border-[color:var(--color-outline-variant)] rounded-xl px-4 py-3 bg-[color:var(--color-surface)] text-[color:var(--color-on-surface)] focus:ring-0 focus:border-[color:var(--color-primary)] outline-none"
                >
                  <option value="STUDENT">Student</option>
                  <option value="TEACHER">Teacher</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>

              {role === "STUDENT" && (
                <div>
                  <label className="block text-sm font-[family-name:var(--font-label-sm)] text-[color:var(--color-on-surface-variant)] mb-1">
                    Level (Optional)
                  </label>
                  <select
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                    className="w-full border border-[color:var(--color-outline-variant)] rounded-xl px-4 py-3 bg-[color:var(--color-surface)] text-[color:var(--color-on-surface)] focus:ring-0 focus:border-[color:var(--color-primary)] outline-none"
                  >
                    <option value="">None</option>
                    <option value="Elementary">Elementary</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Upper">Upper</option>
                    <option value="PreFac">PreFac</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-[family-name:var(--font-label-sm)] text-[color:var(--color-on-surface-variant)] mb-1">
                  {isEditing ? "New Password (Optional)" : "Password (Optional)"}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isEditing ? "Leave blank to keep unchanged" : "Defaults to Bilkent123!"}
                  className="w-full border border-[color:var(--color-outline-variant)] rounded-xl px-4 py-3 bg-[color:var(--color-surface)] text-[color:var(--color-on-surface)] focus:ring-0 focus:border-[color:var(--color-primary)] outline-none"
                />
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
                  {loading ? "Saving..." : isEditing ? "Save Changes" : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
