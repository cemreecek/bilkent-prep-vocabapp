import React from "react";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import LogoutButton from "@/components/LogoutButton";
import RoleSwitcher from "@/components/RoleSwitcher";
import ClassroomSelector from "@/components/ClassroomSelector";
import TeacherRoster from "@/components/teacher/TeacherRoster";
import AnalyticsTrigger from "@/components/teacher/AnalyticsTrigger";
import ExportCSVButton from "@/components/teacher/ExportCSVButton";

export default async function TeacherDashboard({ searchParams }: { searchParams: Promise<{ classroomId?: string }> }) {
  const resolvedSearchParams = await searchParams;
  const session = await getServerSession(authOptions);
  const teacherName = session?.user?.name || "Teacher";
  const teacherId = session?.user?.id;

  // Live Data Fetching
  let classroomName = "Academic Excellence - Section B"; // fallback
  let totalStudents = 25; // fallback
  let avgDailyStreak = 4.2; // fallback
  let practiceTimeAvg = 12; // fallback
  let joinCode = "";
  let roster: any[] = [];
  let topErrors: { word: string, count: number }[] = [];

  let allClassrooms: { id: string; name: string }[] = [];
  let selectedClassroomId = resolvedSearchParams.classroomId || "";

  if (teacherId) {
    try {
      allClassrooms = await prisma.classroom.findMany({
        where: { teacherId },
        select: { id: true, name: true },
        orderBy: { createdAt: 'desc' }
      });
      if (!selectedClassroomId && allClassrooms.length > 0) {
        selectedClassroomId = allClassrooms[0].id;
      }

      const liveClassroom = await prisma.classroom.findUnique({
        where: { id: selectedClassroomId || "none" },
        include: {
          students: {
            include: {
              streaks: true,
              sessions: true,
            }
          }
        }
      });

      if (liveClassroom) {
        joinCode = liveClassroom.joinCode || "";
        classroomName = liveClassroom.name;
        if (liveClassroom.students.length > 0) {
          totalStudents = liveClassroom.students.length;
        
        const totalStreak = liveClassroom.students.reduce((sum, s) => sum + (s.streaks?.currentStreak || 0), 0);
        avgDailyStreak = Number((totalStreak / totalStudents).toFixed(1));

        const totalDuration = liveClassroom.students.reduce((sum, s) => {
          const studentTotal = s.sessions?.reduce((sSum, sess) => sSum + (sess.duration || 0), 0) || 0;
          return sum + studentTotal;
        }, 0);
        
        practiceTimeAvg = Math.round((totalDuration / 3600) / totalStudents);

        roster = liveClassroom.students.map(s => {
          const streak = s.streaks?.currentStreak || 0
          const debt = s.errorScore || 0
          
          const streakPoints = Math.min(5, streak)
          const debtPenalty = Math.min(5, Math.floor(debt / 5))
          const debtPoints = Math.max(0, 5 - debtPenalty)
          const weeklyPoints = streakPoints + debtPoints

          return {
            id: s.id,
            name: s.name || "Student",
            email: s.email,
            initials: (s.name || "S").substring(0, 2).toUpperCase(),
            streak,
            debt,
            points: weeklyPoints,
          lastLogin: s.streaks?.lastLogin || s.createdAt,
          timeSpentHours: ((s.sessions?.reduce((sSum, sess) => sSum + (sess.duration || 0), 0) || 0) / 3600).toFixed(1)
          }
        });

        const errorCounts = await prisma.errorLog.groupBy({
          by: ['wordId'],
          where: {
            user: { classroomId: liveClassroom.id }
          },
          _count: { wordId: true },
          orderBy: { _count: { wordId: 'desc' } },
          take: 3
        });
        
        for (const e of errorCounts) {
           if (!e.wordId) continue;
           const w = await prisma.vocabWord.findUnique({where: {id: e.wordId}});
           if (w) {
             topErrors.push({ word: w.word, count: e._count.wordId });
           }
        }
        }
      }
    } catch (e) {
      console.error("Failed to fetch teacher data", e);
    }
  }

  const hasLiveRoster = roster.length > 0;

  return (
    <div className="flex bg-[color:var(--color-surface)] min-h-screen">
      {/* Navigation Drawer (Desktop Anchor) */}
      <aside className="hidden md:flex flex-col h-full w-72 fixed left-0 top-0 bg-[color:var(--color-surface-container-low)] border-r border-[color:var(--color-outline-variant)] py-[var(--spacing-base)] z-50">
        <div className="px-6 py-8 mb-4">
          <h1 className="font-[family-name:var(--font-headline-lg)] text-[length:var(--text-headline-lg)] text-[color:var(--color-primary)]">
            Instructor Portal
          </h1>
          <p className="font-[family-name:var(--font-body-md)] text-[color:var(--color-on-surface-variant)]">
            Campus Vocab
          </p>
        </div>
        <nav className="flex-grow">
          <div className="flex items-center text-[color:var(--color-primary)] font-bold border-l-4 border-[color:var(--color-primary)] pl-4 py-3 cursor-pointer transition-colors duration-150">
            <span className="material-symbols-outlined mr-3">grid_view</span>
            <span>Overview</span>
          </div>
          <div className="flex items-center text-[color:var(--color-on-surface-variant)] pl-5 py-3 opacity-50 cursor-not-allowed transition-all">
            <span className="material-symbols-outlined mr-3">trending_up</span>
            <span>Student Progress</span>
          </div>
          <div className="flex items-center text-[color:var(--color-on-surface-variant)] pl-5 py-3 opacity-50 cursor-not-allowed transition-all">
            <span className="material-symbols-outlined mr-3">settings</span>
            <span>Settings</span>
          </div>
        </nav>
        <div className="mt-auto px-4 py-4 flex flex-col gap-2 border-t border-[color:var(--color-outline-variant)]">
          <RoleSwitcher targetUrl="/dashboard" label="Student View" className="flex items-center gap-2 text-[color:var(--color-primary)] hover:bg-[color:var(--color-primary)]/10 px-4 py-2 rounded-xl transition-colors font-bold text-sm w-full" />
          <LogoutButton className="flex items-center gap-2 text-[color:var(--color-error)] hover:bg-[color:var(--color-error)]/10 px-4 py-2 rounded-xl transition-colors font-bold text-sm w-full" />
        </div>
      </aside>

      {/* Main Content Canvas */}
      <main className="md:ml-72 min-h-screen pb-24 md:pb-8 w-full">
        {/* TopAppBar */}
        <header className="bg-[color:var(--color-surface)] shadow-sm w-full top-0 sticky z-40 flex justify-between items-center px-[var(--spacing-container-padding-mobile)] md:px-[var(--spacing-container-padding-desktop)] h-16">
          <div className="flex items-center space-x-4">
            <nav className="hidden md:flex text-xs items-center text-[color:var(--color-on-surface-variant)] space-x-2">
              <span>Courses</span>
              <span className="material-symbols-outlined text-sm">chevron_right</span>
              <ClassroomSelector classrooms={allClassrooms} selectedId={selectedClassroomId} />
              <span className="material-symbols-outlined text-sm">chevron_right</span>
              <span className="text-[color:var(--color-primary)] font-bold">Dashboard</span>
            </nav>
            <span className="md:hidden font-[family-name:var(--font-title-md)] text-[length:var(--text-title-md)] font-bold text-[color:var(--color-primary)]">
              Campus Vocab
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center bg-[color:var(--color-surface-container-high)] px-3 py-1 rounded-full text-[color:var(--color-secondary)] font-bold">
              <span className="material-symbols-outlined mr-1" style={{ fontVariationSettings: "'FILL' 1" }}>
                flare
              </span>
              <span className="font-[family-name:var(--font-label-sm)]">Class Streak: {avgDailyStreak}</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-[color:var(--color-surface-container)] flex items-center justify-center cursor-pointer active:scale-95 transition-transform">
              <span className="material-symbols-outlined text-[color:var(--color-primary)]">
                notifications
              </span>
            </div>
            <LogoutButton className="md:hidden flex items-center justify-center w-8 h-8 rounded-full bg-[color:var(--color-error-container)] text-[color:var(--color-error)] [&>span:last-child]:hidden" />
          </div>
        </header>

        <div className="p-[var(--spacing-container-padding-mobile)] md:p-[var(--spacing-container-padding-desktop)] space-y-[var(--spacing-section-gap)]">
          {/* Dashboard Header & Export */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h2 className="font-[family-name:var(--font-headline-lg-mobile)] md:font-[family-name:var(--font-headline-lg)] text-[length:var(--text-headline-lg)] text-[color:var(--color-primary)]">
                Teacher Dashboard
              </h2>
              <div className="flex items-center gap-3 mt-1">
                <p className="font-[family-name:var(--font-body-md)] text-[color:var(--color-on-surface-variant)]">
                  Class: {classroomName}
                </p>
                {joinCode && (
                  <div className="flex items-center gap-2 bg-[color:var(--color-secondary)]/10 px-3 py-1 rounded border border-[color:var(--color-secondary)]/30">
                    <span className="text-xs text-[color:var(--color-on-surface-variant)]">Join Code:</span>
                    <span className="font-mono text-sm font-bold text-[color:var(--color-secondary)] tracking-widest">{joinCode}</span>
                  </div>
                )}
              </div>
            </div>
            <ExportCSVButton roster={roster} />
          </div>

          {/* Stats Overview Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-[var(--spacing-gutter)]">
            <div className="bg-[color:var(--color-surface-container-lowest)] p-6 rounded-xl border border-[color:var(--color-outline-variant)] hover:shadow-sm transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[color:var(--color-on-surface-variant)] font-[family-name:var(--font-label-sm)] uppercase tracking-wider">
                  Total Students
                </p>
                <span className="material-symbols-outlined text-[color:var(--color-primary)]">
                  group
                </span>
              </div>
              <p className="text-[length:var(--text-display-lg)] font-[family-name:var(--font-display-lg)] text-[color:var(--color-primary)]">
                {totalStudents}
              </p>
              <div className="mt-2 flex items-center text-[color:var(--color-secondary)] font-medium">
                <span className="material-symbols-outlined text-sm mr-1">trending_up</span>
                <span className="text-xs">{hasLiveRoster ? 'Active this week' : '+2 enrolled this week'}</span>
              </div>
            </div>
            <AnalyticsTrigger roster={roster} topErrors={topErrors} />
            <div className="bg-[color:var(--color-surface-container-lowest)] p-6 rounded-xl border border-[color:var(--color-outline-variant)] hover:shadow-sm transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[color:var(--color-on-surface-variant)] font-[family-name:var(--font-label-sm)] uppercase tracking-wider">
                  Practice Time
                </p>
                <span className="material-symbols-outlined text-[color:var(--color-on-tertiary-container)]">
                  schedule
                </span>
              </div>
              <p className="text-[length:var(--text-display-lg)] font-[family-name:var(--font-display-lg)] text-[color:var(--color-on-tertiary-container)]">
                {practiceTimeAvg}h<span className="text-[length:var(--text-title-md)]">/avg</span>
              </p>
              <p className="text-xs text-[color:var(--color-on-surface-variant)] mt-2 font-medium">
                Weekly engagement target: 15h
              </p>
            </div>
          </div>

          {/* Error Analytics & Roster Section */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-[var(--spacing-gutter)]">
            {/* Class Error Analytics */}
            <section className="lg:col-span-4 bg-[color:var(--color-surface-container-lowest)] rounded-xl border border-[color:var(--color-outline-variant)] overflow-hidden">
              <div className="p-6 border-b border-[color:var(--color-outline-variant)] bg-[color:var(--color-surface-container-low)]">
                <h3 className="font-[family-name:var(--font-title-md)] text-[length:var(--text-title-md)] text-[color:var(--color-primary)] flex items-center">
                  <span className="material-symbols-outlined mr-2 text-[color:var(--color-error)]">
                    analytics
                  </span>
                  Error Analytics
                </h3>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <p className="font-[family-name:var(--font-label-sm)] text-[color:var(--color-on-surface-variant)] mb-4">
                    MOST MISSED CONCEPTS
                  </p>
                  <div className="space-y-4">
                    {topErrors.length > 0 ? (
                      topErrors.map((err, index) => {
                        const maxCount = topErrors[0].count;
                        const percentage = Math.max(10, (err.count / maxCount) * 100);
                        const colors = [
                          { bg: "bg-[color:var(--color-error)]", text: "text-[color:var(--color-error)]" },
                          { bg: "bg-[color:var(--color-error-container)]", text: "text-[color:var(--color-error-container)]" },
                          { bg: "bg-[color:var(--color-secondary)]", text: "text-[color:var(--color-secondary)]" }
                        ];
                        const c = colors[index % colors.length];
                        return (
                          <div key={err.word} className="space-y-2">
                            <div className="flex justify-between items-center text-sm">
                              <span className="font-bold text-[color:var(--color-on-surface)]">"{err.word}"</span>
                              <span className={`${c.text} font-bold`}>{err.count} Mistakes</span>
                            </div>
                            <div className="w-full bg-[color:var(--color-surface-container)] h-2 rounded-full overflow-hidden">
                              <div className={`${c.bg} h-full`} style={{ width: `${percentage}%` }}></div>
                            </div>
                          </div>
                        )
                      })
                    ) : (
                      <p className="text-sm text-[color:var(--color-on-surface-variant)] italic">No student errors recorded yet.</p>
                    )}
                  </div>
                </div>
                <div className="p-4 bg-[color:var(--color-error-container)] rounded-xl">
                  <p className="text-[color:var(--color-on-error-container)] font-[family-name:var(--font-label-sm)] flex items-center">
                    <span className="material-symbols-outlined mr-2 text-sm">lightbulb</span>
                    Action Item
                  </p>
                  <p className="text-xs text-[color:var(--color-on-error-container)] mt-1">
                    Schedule a review session for 'Ambiguous' vocabulary contexts during next Friday's lecture.
                  </p>
                </div>
              </div>
            </section>

            {/* Student Roster Table */}
            <TeacherRoster roster={roster} />
          </div>
        </div>
      </main>

      {/* BottomNavBar (Mobile Only) */}
      <nav className="md:hidden fixed bottom-0 w-full z-50 bg-[color:var(--color-surface)] flex justify-around items-center h-20 px-4 pb-2 border-t border-[color:var(--color-outline-variant)]">
        <div className="flex flex-col items-center justify-center bg-[color:var(--color-primary-container)] text-[color:var(--color-on-primary-container)] rounded-full px-5 py-1 transition-all duration-200 active:scale-90">
          <span className="material-symbols-outlined">dashboard</span>
          <span className="font-[family-name:var(--font-label-sm)] text-[length:var(--text-label-sm)]">Dashboard</span>
        </div>
        <Link href="/dashboard" className="flex flex-col items-center justify-center text-[color:var(--color-on-surface-variant)] px-5 py-1 transition-all duration-200 active:scale-90">
          <span className="material-symbols-outlined">switch_account</span>
          <span className="font-[family-name:var(--font-label-sm)] text-[length:var(--text-label-sm)]">Student View</span>
        </Link>
        <Link href="/teacher" className="flex flex-col items-center justify-center text-[color:var(--color-on-surface-variant)] px-5 py-1 transition-all duration-200 active:scale-90">
          <span className="material-symbols-outlined">analytics</span>
          <span className="font-[family-name:var(--font-label-sm)] text-[length:var(--text-label-sm)]">Analytics</span>
        </Link>
      </nav>
    </div>
  );
}
