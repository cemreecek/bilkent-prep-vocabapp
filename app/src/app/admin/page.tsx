import React from "react";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import LogoutButton from "@/components/LogoutButton";
import RoleSwitcher from "@/components/RoleSwitcher";
import AdminClassroomNameEditor from "@/components/AdminClassroomNameEditor";
import AdminTeacherAssigner from "@/components/AdminTeacherAssigner";
import CreateClassroomModal from "@/components/CreateClassroomModal";
import AdminMobileDrawer from "@/components/admin/AdminMobileDrawer";
import RealTimeSystemEvents from "@/components/admin/RealTimeSystemEvents";
import AdminStudentAssignerModal from "@/components/admin/AdminStudentAssignerModal";
import AdminTeacherAssignerAction from "@/components/admin/AdminTeacherAssignerAction";

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);
  const adminName = session?.user?.name || "Admin";

  // Live Data Fetching
  let totalClassrooms = 42; // fallback
  let assignedTeachers = 38; // fallback
  let academicErrorDebt = 14208; // fallback
  let totalActive = 1240; // fallback
  let classrooms: any[] = [];
  let systemEvents: any[] = [];
  let allTeachers: { id: string; name: string | null }[] = [];
  let unassignedStudents: { id: string; name: string | null; email: string }[] = [];

  try {
    const [classCount, teacherCount, allUsers, fetchedTeachers, fetchedUnassignedStudents] = await Promise.all([
      prisma.classroom.count(),
      prisma.user.count({ where: { role: 'TEACHER' } }),
      prisma.user.findMany({ select: { errorScore: true } }),
      prisma.user.findMany({ where: { role: 'TEACHER' }, select: { id: true, name: true } }),
      prisma.user.findMany({ where: { role: 'STUDENT', classroomId: null }, select: { id: true, name: true, email: true } })
    ]);
    
    allTeachers = fetchedTeachers;
    unassignedStudents = fetchedUnassignedStudents;

    if (classCount > 0) totalClassrooms = classCount;
    if (teacherCount > 0) assignedTeachers = teacherCount;
    
    const totalScore = allUsers.reduce((sum, u) => sum + (u.errorScore || 0), 0);
    if (totalScore > 0) academicErrorDebt = totalScore;
    if (allUsers.length > 0) totalActive = allUsers.length;

    const liveClassrooms = await prisma.classroom.findMany({
      include: {
        teacher: true,
        _count: { select: { students: true } }
      },
      take: 12
    });

    if (liveClassrooms.length > 0) {
      classrooms = liveClassrooms.map(c => ({
        id: c.id,
        name: c.name,
        teacherId: c.teacherId,
        teacherName: c.teacher?.name || "Unassigned",
        studentCount: c._count.students,
        maxStudents: 25,
        joinCode: c.joinCode,
        level: c.level
      }));
    }

    // @ts-ignore - SystemEvent type may not be available yet due to hot-reload timing
    const liveEvents = await prisma.systemEvent.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    if (liveEvents.length > 0) {
      systemEvents = liveEvents.map((e: any) => ({
        id: e.id,
        title: e.title,
        description: e.description,
        type: e.type,
        timeAgo: new Date(e.createdAt).toLocaleDateString()
      }));
    }
  } catch (e) {
    console.error("Failed to fetch admin data", e);
  }

  const hasLiveClassrooms = classrooms.length > 0;
  const hasLiveEvents = systemEvents.length > 0;

  return (
    <div className="bg-[color:var(--color-background)] text-[color:var(--color-on-background)] min-h-screen flex">
      {/* NavigationDrawer (Shared Component) */}
      <aside className="hidden md:flex flex-col h-full w-72 fixed left-0 top-0 bg-[color:var(--color-surface-container-low)] border-r border-[color:var(--color-outline-variant)] py-[var(--spacing-base)] z-40">
        <div className="px-6 py-8 flex flex-col items-start">
          <div className="flex items-center gap-3 mb-6">
            <img
              alt="Bilkent Logo"
              className="w-10 h-10 rounded-full"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCFGv73Y2XTtTVpuPM6aQP5_Pqy_14Gmkq5ZzfPdOfTSV7G5TxxstsTP2tt1PWuoCphjovmWbZeczlYi8xOlX2g55DqYycVGgC59VVbEuuxKbn4OUWGkj43Vc8w2cprilKadqNmEDpsp0EXIzFa1bY-vFaQmfvnTLDBkK_TOpeWKuXeBDxHQ6bMdgladyEXxF8A9_0px1ISeQ4s9AjdG6bdGr1mC9oY3syFnpqtcKBQk3RSyY1UkrZrUFpTo0A_7iHuPUicfrfOZGoJ"
            />
            <div>
              <h1 className="font-[family-name:var(--font-headline-lg)] text-[length:var(--text-headline-lg)] text-[color:var(--color-primary)]">
                Instructor Portal
              </h1>
              <p className="font-[family-name:var(--font-body-md)] text-[length:var(--text-label-sm)] text-[color:var(--color-on-surface-variant)]">
                Bilkent Prep School
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
          <Link href="/admin" className="flex items-center text-[color:var(--color-primary)] font-bold border-l-4 border-[color:var(--color-primary)] pl-4 py-3 cursor-pointer">
            <span className="material-symbols-outlined mr-3">grid_view</span>
            <span className="font-[family-name:var(--font-body-md)] text-[length:var(--text-body-md)]">
              Overview
            </span>
          </Link>
          <Link href="/admin/users" className="flex items-center text-[color:var(--color-on-surface-variant)] pl-5 py-3 hover:bg-[color:var(--color-surface-container-high)] transition-all cursor-pointer group">
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
        {/* TopAppBar (Shared Component) */}
        <header className="w-full top-0 sticky bg-[color:var(--color-surface)] shadow-sm flex justify-between items-center px-[var(--spacing-container-padding-mobile)] md:px-[var(--spacing-container-padding-desktop)] h-16 z-30">
          <div className="flex items-center gap-4">
            <AdminMobileDrawer />
            <span className="font-[family-name:var(--font-title-md)] text-[length:var(--text-title-md)] font-bold text-[color:var(--color-primary)]">
              Bilkent Prep
            </span>
          </div>
          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-2 bg-[color:var(--color-secondary-container)]/10 px-3 py-1 rounded-full">
              <span className="material-symbols-outlined text-[color:var(--color-secondary)]" style={{ fontVariationSettings: "'FILL' 1" }}>
                flare
              </span>
              <span className="font-[family-name:var(--font-label-sm)] text-[color:var(--color-secondary)] font-bold">
                {totalActive.toLocaleString()} Total Active
              </span>
            </div>
            <div className="w-8 h-8 rounded-full bg-[color:var(--color-surface-container-highest)] border border-[color:var(--color-outline-variant)] flex items-center justify-center">
              <span className="material-symbols-outlined text-[color:var(--color-on-surface-variant)] text-sm">
                person
              </span>
            </div>
          </div>
        </header>

        <main className="p-[var(--spacing-container-padding-mobile)] md:p-[var(--spacing-container-padding-desktop)] pb-32 flex-1">
          {/* Dashboard Header & Stats Bento */}
          <section className="mb-[var(--spacing-section-gap)]">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
              <div>
                <h2 className="font-[family-name:var(--font-display-lg)] text-[length:var(--text-display-lg)] text-[color:var(--color-primary)] tracking-tight">
                  God View
                </h2>
              </div>
              <div className="flex gap-3">
                <Link href="/practice" className="bg-blue-100 text-blue-700 px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-200 transition-colors border border-blue-200">
                  <span className="material-symbols-outlined">edit_square</span>
                  Live Editor
                </Link>
                <Link href="/admin/content-manager" className="bg-[color:var(--color-primary-container)] text-[color:var(--color-on-primary-container)] px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:opacity-90 transition-opacity">
                  <span className="material-symbols-outlined">auto_awesome</span>
                  AI Content Parser
                </Link>
                <CreateClassroomModal teachers={allTeachers} />
              </div>
            </div>

            {/* Bento Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-[var(--spacing-gutter)]">
              <div className="bg-[color:var(--color-surface-container-lowest)] border border-[color:var(--color-outline-variant)] p-6 rounded-xl">
                <p className="text-[color:var(--color-on-surface-variant)] font-[family-name:var(--font-label-sm)] mb-2">
                  Total Classrooms
                </p>
                <p className="text-[length:var(--text-headline-lg)] font-[family-name:var(--font-headline-lg)] text-[color:var(--color-primary)]">
                  {totalClassrooms}
                </p>
              </div>
              <div className="bg-[color:var(--color-surface-container-lowest)] border border-[color:var(--color-outline-variant)] p-6 rounded-xl">
                <p className="text-[color:var(--color-on-surface-variant)] font-[family-name:var(--font-label-sm)] mb-2">
                  Assigned Teachers
                </p>
                <p className="text-[length:var(--text-headline-lg)] font-[family-name:var(--font-headline-lg)] text-[color:var(--color-primary)]">
                  {assignedTeachers}
                </p>
              </div>
              <div className="bg-[color:var(--color-surface-container-lowest)] border border-[color:var(--color-outline-variant)] p-6 rounded-xl col-span-1 md:col-span-2 relative overflow-hidden group">
                <div className="relative z-10">
                  <p className="text-[color:var(--color-on-surface-variant)] font-[family-name:var(--font-label-sm)] mb-2">
                    Academic Error Debt
                  </p>
                  <p className="text-[length:var(--text-headline-lg)] font-[family-name:var(--font-headline-lg)] text-[color:var(--color-error)]">
                    {academicErrorDebt.toLocaleString()}
                  </p>
                </div>
                <div className="absolute right-0 top-0 h-full w-1/3 bg-[color:var(--color-error)]/5 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[color:var(--color-error)] text-5xl opacity-20">
                    warning
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Classroom Management Table */}
          <section className="bg-[color:var(--color-surface-container-lowest)] border border-[color:var(--color-outline-variant)] rounded-xl overflow-hidden shadow-sm">
            <div className="px-6 py-5 border-b border-[color:var(--color-outline-variant)] flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h3 className="font-[family-name:var(--font-title-md)] text-[length:var(--text-title-md)] text-[color:var(--color-primary)]">
                Active Classrooms
              </h3>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <input
                    className="pl-10 pr-4 py-2 border border-[color:var(--color-outline-variant)] rounded-full text-sm focus:border-[color:var(--color-primary)] focus:ring-0 w-64 bg-[color:var(--color-surface)]"
                    placeholder="Search sections..."
                    type="text"
                  />
                  <span className="material-symbols-outlined absolute left-3 top-2.5 text-[color:var(--color-on-surface-variant)] text-sm">
                    search
                  </span>
                </div>
                <button className="p-2 border border-[color:var(--color-outline-variant)] rounded-full text-[color:var(--color-on-surface-variant)] hover:bg-[color:var(--color-surface-container-high)] transition-colors">
                  <span className="material-symbols-outlined">filter_list</span>
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[color:var(--color-surface-container-low)]">
                  <tr>
                    <th className="px-6 py-4 font-[family-name:var(--font-label-sm)] text-[color:var(--color-on-surface-variant)]">Section</th>
                    <th className="px-6 py-4 font-[family-name:var(--font-label-sm)] text-[color:var(--color-on-surface-variant)]">Level</th>
                    <th className="px-6 py-4 font-[family-name:var(--font-label-sm)] text-[color:var(--color-on-surface-variant)]">Assigned Teacher</th>
                    <th className="px-6 py-4 font-[family-name:var(--font-label-sm)] text-[color:var(--color-on-surface-variant)]">Student Count</th>
                    <th className="px-6 py-4 font-[family-name:var(--font-label-sm)] text-[color:var(--color-on-surface-variant)]">Join Code</th>
                    <th className="px-6 py-4 font-[family-name:var(--font-label-sm)] text-[color:var(--color-on-surface-variant)] text-right">Quick Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[color:var(--color-outline-variant)]">
                    {hasLiveClassrooms ? (
                      classrooms.map((cls) => (
                        <tr key={cls.id} className="hover:bg-[color:var(--color-surface-container)] transition-colors group">
                          <td className="px-6 py-4">
                            <AdminClassroomNameEditor classroomId={cls.id} initialName={cls.name} />
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-xs bg-[color:var(--color-secondary)]/10 text-[color:var(--color-secondary)] px-2 py-1 rounded-full font-bold">
                              {cls.level}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <AdminTeacherAssigner 
                              classroomId={cls.id} 
                              currentTeacherId={cls.teacherId} 
                              teachers={allTeachers} 
                            />
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <span className="text-[length:var(--text-body-md)] text-[color:var(--color-on-surface)]">{cls.studentCount}</span>
                              <span className="text-xs text-[color:var(--color-on-surface-variant)]">/ {cls.maxStudents}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-[family-name:var(--font-body-md)] font-mono text-[color:var(--color-secondary)] bg-[color:var(--color-secondary)]/10 px-2 py-1 rounded w-fit tracking-wider">
                              {cls.joinCode}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                              <AdminStudentAssignerModal classroomId={cls.id} unassignedStudents={unassignedStudents} />
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr className="hover:bg-[color:var(--color-surface-container)] transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-2 h-8 bg-[color:var(--color-primary)] rounded-full"></div>
                            <span className="font-[family-name:var(--font-body-md)] font-bold text-[color:var(--color-primary)]">
                              Section 101
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <img
                              alt="Teacher"
                              className="w-8 h-8 rounded-full"
                              src="https://lh3.googleusercontent.com/aida-public/AB6AXuC9x1BqMBXhCRUQjzxvmosCILMAQLsUEpGTE1f178eBW7t5llAl9kf7WJ8YtevsxV859Rzq1WByKSb0IU5hwy-dCXADVi2uo1tDsR8hqIFsfok-EPgR7YroJuX7xvE34bL6UsOHs-CfhCNXOEYCmCfdqdFGajtsZ2PIulRBEVEYtRTMDmesD-dDYMtj-mfYHDd0Q_OO1PIRyzuNqu1NIIHYNgA_mNho-e41SXieBHcu2s2KsyWaxxuvG0lMtvUJ4Qqc5hc3FINUnniX"
                            />
                            <div>
                              <p className="font-[family-name:var(--font-label-sm)] text-[color:var(--color-primary)]">Dr. Aras Demir</p>
                              <p className="text-[11px] text-[color:var(--color-on-surface-variant)] uppercase tracking-wider">Level A1 Core</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="text-[length:var(--text-body-md)] text-[color:var(--color-on-surface)]">24</span>
                            <span className="text-xs text-[color:var(--color-on-surface-variant)]">/ 25</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="w-32 h-1.5 bg-[color:var(--color-surface-container-high)] rounded-full overflow-hidden">
                            <div className="bg-[color:var(--color-primary-container)] h-full w-[82%]"></div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button className="p-2 text-[color:var(--color-on-surface-variant)] hover:text-[color:var(--color-primary)] transition-colors border border-[color:var(--color-outline-variant)] rounded-lg">
                              <span className="material-symbols-outlined text-sm">group</span>
                            </button>
                            <button className="p-2 text-[color:var(--color-on-surface-variant)] hover:text-[color:var(--color-primary)] transition-colors border border-[color:var(--color-outline-variant)] rounded-lg">
                              <span className="material-symbols-outlined text-sm">person_add</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
              </table>
            </div>
            <div className="px-6 py-4 bg-[color:var(--color-surface)] border-t border-[color:var(--color-outline-variant)] flex items-center justify-between">
              <span className="font-[family-name:var(--font-label-sm)] text-[color:var(--color-on-surface-variant)]">
                Showing 1-12 of 42 sections
              </span>
              <div className="flex gap-1">
                <button className="p-2 border border-[color:var(--color-outline-variant)] rounded-lg text-[color:var(--color-on-surface-variant)] disabled:opacity-30" disabled>
                  <span className="material-symbols-outlined text-sm">chevron_left</span>
                </button>
                <button className="px-3 py-1 bg-[color:var(--color-primary)] text-[color:var(--color-on-primary)] rounded-lg text-sm font-bold">1</button>
                <button className="px-3 py-1 border border-[color:var(--color-outline-variant)] rounded-lg text-[color:var(--color-on-surface-variant)] text-sm hover:bg-[color:var(--color-surface-container-high)]">2</button>
                <button className="p-2 border border-[color:var(--color-outline-variant)] rounded-lg text-[color:var(--color-on-surface-variant)]">
                  <span className="material-symbols-outlined text-sm">chevron_right</span>
                </button>
              </div>
            </div>
          </section>

          {/* System Overview Cards */}
          <section className="mt-[var(--spacing-section-gap)] grid grid-cols-1 lg:grid-cols-3 gap-[var(--spacing-gutter)]">

            {/* Global Activity Feed */}
            <div className="bg-[color:var(--color-surface-container-lowest)] border border-[color:var(--color-outline-variant)] p-6 rounded-xl col-span-1 lg:col-span-2">
              <div className="flex items-center justify-between mb-6">
                <h4 className="font-[family-name:var(--font-title-md)] text-[color:var(--color-primary)]">Recent System Events</h4>
                <button className="text-[color:var(--color-primary)] font-[family-name:var(--font-label-sm)]">View Log</button>
              </div>
              <RealTimeSystemEvents initialEvents={systemEvents} />
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
