import { effectiveStreak, dayIndex, studyDaySet, studyWeek, studyDaysThisMonth, streakFromStudyDays } from "@/lib/streak"
import { getClassroomAnalytics, type ActionItem, type TopErrorItem } from "@/lib/teacherAnalytics"
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
import ErrorAnalyticsPanel from "@/components/teacher/ErrorAnalyticsPanel";
import ExportCSVButton from "@/components/teacher/ExportCSVButton";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function TeacherDashboard({ searchParams }: { searchParams: Promise<{ classroomId?: string }> }) {
  const resolvedSearchParams = await searchParams;
  const session = await getServerSession(authOptions);
  const teacherId = session?.user?.id;

  let classroomName = "No Classroom Selected";
  let totalStudents = 0;
  let avgDailyStreak = 0;
  let practiceTimeAvg = "0.0";
  let joinCode = "";
  let roster: any[] = [];
  let topErrors: TopErrorItem[] = [];
  let actionItems: ActionItem[] = [];

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
              journalEntries: { select: { createdAt: true } },
              flashcardProgress: { select: { lastReviewAt: true } },
              errorLogs: { select: { id: true, questionId: true, wordId: true } },
            }
          }
        }
      });

      if (liveClassroom) {
        joinCode = liveClassroom.joinCode || "";
        classroomName = liveClassroom.name;
        totalStudents = liveClassroom.students.length;

        if (liveClassroom.students.length > 0) {
          const now = new Date();
          const todayIdx = dayIndex(now);

          let classStreakSum = 0;
          let classDurationSecSum = 0;

          roster = liveClassroom.students.map(s => {
            const allActivityDates: Date[] = [
              ...(s.sessions?.map(x => new Date(x.startTime)) || []),
              ...(s.journalEntries?.map(x => new Date(x.createdAt)) || []),
              ...(s.flashcardProgress?.filter(x => x.lastReviewAt != null).map(x => new Date(x.lastReviewAt!)) || []),
              ...(s.streaks?.lastLogin ? [new Date(s.streaks.lastLogin)] : []),
            ];

            const latestActivity = allActivityDates.length > 0
              ? allActivityDates.sort((a, b) => b.getTime() - a.getTime())[0]
              : null;

            const studyDays = studyDaySet(allActivityDates.map(d => ({ startTime: d })));
            const weekDays = studyWeek(studyDays, now);
            const streak = Math.max(effectiveStreak(s.streaks, now), streakFromStudyDays(studyDays, now));
            classStreakSum += streak;

            // Real open error debt derived from unique unresolved error logs (5 pts each)
            const uniqErrorCount = new Set(
              (s.errorLogs || []).map(e => e.questionId ? `q:${e.questionId}` : e.wordId ? `w:${e.wordId}` : e.id)
            ).size;
            const debt = uniqErrorCount > 0 ? uniqErrorCount * 5 : (s.errorScore || 0);

            // 0 debt = 5.0 points. Penalty: 1.0 point per 15 debt points (0.333 per 5-pt mistake)
            const debtPenalty = debt / 15;
            let weeklyPoints = (5.0 - debtPenalty).toFixed(1);
            if (parseFloat(weeklyPoints) < 0) weeklyPoints = "0.0";

            const studentSec = s.sessions?.reduce((sSum, sess) => sSum + (sess.duration || 0), 0) || 0;
            classDurationSecSum += studentSec;

            return {
              id: s.id,
              name: (s.name || "Student").trim(),
              email: s.email,
              initials: ((s.name || "S").trim()).substring(0, 2).toUpperCase(),
              streak,
              weekDays,
              weekCount: weekDays.filter(Boolean).length,
              monthCount: studyDaysThisMonth(studyDays, now),
              practicedToday: studyDays.has(todayIdx),
              debt,
              openMistakes: uniqErrorCount,
              points: weeklyPoints,
              lastLogin: latestActivity ? latestActivity.toISOString() : null,
              timeSpentHours: (studentSec / 3600).toFixed(1),
              timeSpentMinutes: Math.round(studentSec / 60),
              sessionCount: s.sessions?.length || 0,
            };
          });

          avgDailyStreak = Number((classStreakSum / totalStudents).toFixed(1));
          practiceTimeAvg = ((classDurationSecSum / 3600) / totalStudents).toFixed(1);
        }

        const analytics = await getClassroomAnalytics(liveClassroom.id);
        topErrors = analytics.topErrors;
        actionItems = analytics.actionItems;
      }
    } catch (e) {
      console.error("Failed to fetch teacher data", e);
    }
  }

  const hasLiveRoster = roster.length > 0;
  const activeThisWeekCount = roster.filter(s => (s.weekCount || 0) > 0).length;

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

          {/* Top Section: General Stats + Live Error Analytics side-by-side */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-[var(--spacing-gutter)] items-start">
            {/* General Stats (Total Students, Class Performance, Practice Time) */}
            <div className="xl:col-span-6 grid grid-cols-1 sm:grid-cols-3 gap-[var(--spacing-gutter)]">
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
                  <span className="text-xs">{activeThisWeekCount} of {totalStudents} active this week</span>
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
                  Total sessions: {roster.reduce((sum, s) => sum + (s.sessionCount || 0), 0)}
                </p>
              </div>
            </div>

            {/* Live Error Analytics + Real-Time Action Items */}
            <div className="xl:col-span-6">
              <ErrorAnalyticsPanel
                classroomId={selectedClassroomId}
                initialTopErrors={topErrors}
                initialActionItems={actionItems}
              />
            </div>
          </div>

          {/* Middle Section: Full-Width Student Roster Table */}
          <div className="w-full">
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
