import React from "react";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import LogoutButton from "@/components/LogoutButton";
import UserManagementModal from "@/components/UserManagementModal";
import AdminMobileDrawer from "@/components/admin/AdminMobileDrawer";

export default async function AdminUsersPage() {
  const session = await getServerSession(authOptions);
  
  const allUsers = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="bg-[color:var(--color-background)] text-[color:var(--color-on-background)] min-h-screen flex">
      {/* NavigationDrawer */}
      <aside className="hidden md:flex flex-col h-full w-72 fixed left-0 top-0 bg-[color:var(--color-surface-container-low)] border-r border-[color:var(--color-outline-variant)] py-[var(--spacing-base)] z-40">
        <div className="px-6 py-8 flex flex-col items-start">
          <div className="flex items-center gap-3 mb-6">
            <img
              alt="Campus Vocab Logo"
              className="w-10 h-10 rounded-full"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCFGv73Y2XTtTVpuPM6aQP5_Pqy_14Gmkq5ZzfPdOfTSV7G5TxxstsTP2tt1PWuoCphjovmWbZeczlYi8xOlX2g55DqYycVGgC59VVbEuuxKbn4OUWGkj43Vc8w2cprilKadqNmEDpsp0EXIzFa1bY-vFaQmfvnTLDBkK_TOpeWKuXeBDxHQ6bMdgladyEXxF8A9_0px1ISeQ4s9AjdG6bdGr1mC9oY3syFnpqtcKBQk3RSyY1UkrZrUFpTo0A_7iHuPUicfrfOZGoJ"
            />
            <div>
              <h1 className="font-[family-name:var(--font-headline-lg)] text-[length:var(--text-headline-lg)] text-[color:var(--color-primary)]">
                Instructor Portal
              </h1>
              <p className="font-[family-name:var(--font-body-md)] text-[length:var(--text-label-sm)] text-[color:var(--color-on-surface-variant)]">
                Campus Vocab
              </p>
            </div>
          </div>
          <div className="w-full bg-[color:var(--color-surface-container-high)] rounded-xl p-4 flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-full bg-[color:var(--color-primary-container)] flex items-center justify-center text-[color:var(--color-on-primary-container)] font-bold">
              AD
            </div>
            <div>
              <p className="font-[family-name:var(--font-label-sm)] text-[color:var(--color-primary)] font-bold">
                Admin Access
              </p>
              <p className="text-xs text-[color:var(--color-on-surface-variant)]">
                System Overseer
              </p>
            </div>
          </div>
        </div>
        <nav className="flex-1 px-2">
          <Link href="/admin" className="flex items-center text-[color:var(--color-on-surface-variant)] pl-5 py-3 hover:bg-[color:var(--color-surface-container-high)] transition-all cursor-pointer group">
            <span className="material-symbols-outlined mr-3">grid_view</span>
            <span className="font-[family-name:var(--font-body-md)] text-[length:var(--text-body-md)]">
              Overview
            </span>
          </Link>
          <Link href="/admin/users" className="flex items-center text-[color:var(--color-primary)] font-bold border-l-4 border-[color:var(--color-primary)] pl-4 py-3 cursor-pointer">
            <span className="material-symbols-outlined mr-3">group</span>
            <span className="font-[family-name:var(--font-body-md)] text-[length:var(--text-body-md)]">
              User Management
            </span>
          </Link>
          <div className="flex items-center text-[color:var(--color-on-surface-variant)] pl-5 py-3 hover:bg-[color:var(--color-surface-container-high)] transition-all cursor-pointer group opacity-50">
            <span className="material-symbols-outlined mr-3">settings</span>
            <span className="font-[family-name:var(--font-body-md)] text-[length:var(--text-body-md)]">
              Settings
            </span>
          </div>
        </nav>
        <div className="mt-auto px-4 py-4 flex flex-col gap-2 border-t border-[color:var(--color-outline-variant)]">
          <LogoutButton className="flex items-center gap-2 text-[color:var(--color-error)] hover:bg-[color:var(--color-error)]/10 px-4 py-2 rounded-xl transition-colors font-bold text-sm w-full" />
        </div>
      </aside>

      {/* Main Canvas */}
      <div className="flex-1 md:ml-72 flex flex-col min-h-screen">
        <header className="w-full top-0 sticky bg-[color:var(--color-surface)] shadow-sm flex justify-between items-center px-[var(--spacing-container-padding-mobile)] md:px-[var(--spacing-container-padding-desktop)] h-16 z-30">
          <div className="flex items-center gap-4">
            <AdminMobileDrawer />
            <span className="font-[family-name:var(--font-title-md)] text-[length:var(--text-title-md)] font-bold text-[color:var(--color-primary)]">
              Campus Vocab
            </span>
          </div>
        </header>

        <main className="p-[var(--spacing-container-padding-mobile)] md:p-[var(--spacing-container-padding-desktop)] pb-32 flex-1">
          <section className="mb-[var(--spacing-section-gap)]">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
              <div>
                <h2 className="font-[family-name:var(--font-display-lg)] text-[length:var(--text-display-lg)] text-[color:var(--color-primary)] tracking-tight">
                  User Management
                </h2>
                <p className="font-[family-name:var(--font-body-md)] text-[color:var(--color-on-surface-variant)] max-w-xl">
                  Manage teachers, students, and administrators. You can create accounts manually or update existing credentials.
                </p>
              </div>
              <div className="flex gap-3">
                <UserManagementModal />
              </div>
            </div>
          </section>

          <section className="bg-[color:var(--color-surface-container-lowest)] border border-[color:var(--color-outline-variant)] rounded-xl overflow-hidden shadow-sm">
            <div className="px-6 py-5 border-b border-[color:var(--color-outline-variant)] flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h3 className="font-[family-name:var(--font-title-md)] text-[length:var(--text-title-md)] text-[color:var(--color-primary)]">
                Registered Users ({allUsers.length})
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[color:var(--color-surface-container-low)]">
                  <tr>
                    <th className="px-6 py-4 font-[family-name:var(--font-label-sm)] text-[color:var(--color-on-surface-variant)]">Name</th>
                    <th className="px-6 py-4 font-[family-name:var(--font-label-sm)] text-[color:var(--color-on-surface-variant)]">Email Address</th>
                    <th className="px-6 py-4 font-[family-name:var(--font-label-sm)] text-[color:var(--color-on-surface-variant)]">Role</th>
                    <th className="px-6 py-4 font-[family-name:var(--font-label-sm)] text-[color:var(--color-on-surface-variant)]">Error Score</th>
                    <th className="px-6 py-4 font-[family-name:var(--font-label-sm)] text-[color:var(--color-on-surface-variant)] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[color:var(--color-outline-variant)]">
                  {allUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-[color:var(--color-surface-container)] transition-colors group">
                      <td className="px-6 py-4 font-medium text-[color:var(--color-on-surface)]">{u.name || "Unknown"}</td>
                      <td className="px-6 py-4 text-[color:var(--color-on-surface-variant)]">{u.email}</td>
                      <td className="px-6 py-4">
                        <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                          u.role === 'ADMIN' ? 'bg-[color:var(--color-error)]/10 text-[color:var(--color-error)]' :
                          u.role === 'TEACHER' ? 'bg-[color:var(--color-primary)]/10 text-[color:var(--color-primary)]' :
                          'bg-[color:var(--color-secondary)]/10 text-[color:var(--color-secondary)]'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-[color:var(--color-on-surface-variant)]">{u.errorScore}</td>
                      <td className="px-6 py-4 text-right">
                        <UserManagementModal user={{ id: u.id, name: u.name, email: u.email, role: u.role }} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
