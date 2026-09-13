import React from "react";
import Image from "next/image";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import LogoutButton from "@/components/LogoutButton";
import RoleSwitcher from "@/components/RoleSwitcher";
import JoinClassroom from "@/components/JoinClassroom";
import { prisma } from "@/lib/prisma";

export default async function StudentDashboard() {
  const session = await getServerSession(authOptions);
  const userName = session?.user?.name?.split(' ')[0] || "Student";
  const userId = session?.user?.id;

  let hasClassroom = false;
  let classroomName = "";
  let joinCode = "";
  let classroomLevel = "";
  let dbUser = null;
  if (userId) {
    dbUser = await prisma.user.findUnique({ 
      where: { id: userId }, 
      include: { classroom: true, streaks: true } 
    });
    hasClassroom = !!dbUser?.classroomId;
    if (hasClassroom && dbUser?.classroom) {
      classroomName = dbUser.classroom.name;
      joinCode = dbUser.classroom.joinCode || "";
      // @ts-ignore
      classroomLevel = dbUser.classroom.level || "Elementary";
    }
  }

  console.log("DASHBOARD RENDER:", { userId, userName, hasClassroom });

  return (
    <>
      {/* TopAppBar */}
      <header className="w-full top-0 sticky bg-[color:var(--color-surface)] dark:bg-[color:var(--color-surface-dim)] shadow-sm flex justify-between items-center px-[var(--spacing-container-padding-mobile)] md:px-[var(--spacing-container-padding-desktop)] h-16 z-40">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-[color:var(--color-surface-container-highest)] border border-[color:var(--color-outline-variant)]"></div>
          <div className="text-[length:var(--text-title-md)] font-[family-name:var(--font-title-md)] font-bold text-[color:var(--color-primary)] dark:text-[color:var(--color-primary-fixed-dim)]">
            Campus Vocab
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 text-[color:var(--color-primary)] dark:text-[color:var(--color-primary-fixed-dim)] font-bold hidden sm:flex">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
              local_fire_department
            </span>
            <span className="text-[length:var(--text-label-sm)] font-[family-name:var(--font-label-sm)]">{dbUser?.streaks?.currentStreak || 0}</span>
          </div>
          <div className="h-6 w-px bg-[color:var(--color-outline-variant)] hidden sm:block"></div>
          {session?.user?.role !== 'STUDENT' && (
            <RoleSwitcher 
              targetUrl={session?.user?.role === 'ADMIN' ? '/admin' : '/teacher'} 
              label={session?.user?.role === 'ADMIN' ? 'Admin Portal' : 'Instructor Portal'} 
            />
          )}
          <LogoutButton />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-[var(--spacing-container-padding-mobile)] md:px-[var(--spacing-container-padding-desktop)] py-[var(--spacing-base)] space-y-[var(--spacing-section-gap)] pb-32">
        {/* Welcome Section */}
        <section className="mt-[var(--spacing-base)]">
          <h1 className="font-[family-name:var(--font-headline-lg-mobile)] md:font-[family-name:var(--font-headline-lg)] text-[length:var(--text-headline-lg-mobile)] md:text-[length:var(--text-headline-lg)] text-[color:var(--color-primary)]">
            Welcome back, {userName}
          </h1>
          <p className="text-[color:var(--color-on-surface-variant)] font-[family-name:var(--font-body-md)] mt-1">
            Ready to tackle your daily language targets?
          </p>
          {hasClassroom && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 bg-[color:var(--color-primary-container)] text-[color:var(--color-on-primary-container)] px-3 py-1.5 rounded-lg text-sm font-medium shadow-sm">
                <span className="material-symbols-outlined text-[18px]">school</span>
                <span>{classroomName}</span>
              </div>
              <div className="inline-flex items-center gap-2 bg-[color:var(--color-secondary)]/10 text-[color:var(--color-secondary)] px-3 py-1.5 rounded-lg text-sm font-bold shadow-sm">
                <span>{classroomLevel}</span>
              </div>
            </div>
          )}
        </section>

        {/* Classroom Registration Banner */}
        {!hasClassroom && (
          <section>
            <JoinClassroom />
          </section>
        )}

        {/* Bento Grid Highlights */}
        <section className="grid grid-cols-1 md:grid-cols-12 gap-[var(--spacing-gutter)]">
          {/* Daily Streak Card */}
          <div className={`${(dbUser?.errorScore || 0) > 0 ? 'md:col-span-7' : 'md:col-span-12'} bg-[color:var(--color-surface-container-lowest)] border border-[color:var(--color-outline-variant)] rounded-xl p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow`}>
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <span className="text-[color:var(--color-secondary)] font-[family-name:var(--font-label-sm)] uppercase tracking-wider">
                  Engagement Level
                </span>
                <h2 className="font-[family-name:var(--font-title-md)] text-[length:var(--text-title-md)] text-[color:var(--color-on-surface)]">
                  {dbUser?.streaks?.currentStreak || 0} Day Streak!
                </h2>
              </div>
              <div className="p-3 bg-[color:var(--color-secondary-fixed)] rounded-full text-[color:var(--color-on-secondary-container)]">
                <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  local_fire_department
                </span>
              </div>
            </div>
            <div className="mt-4">
              <p className="font-[family-name:var(--font-body-md)] text-[color:var(--color-on-surface-variant)]">
                Keep going for compounding rewards! Your consistency is putting you in the top 10% of Prep students this week.
              </p>
            </div>
            <div className="mt-6 h-2 w-full bg-[color:var(--color-surface-container-high)] rounded-full overflow-hidden">
              <div className="bg-[color:var(--color-secondary-container)] h-full w-3/5 rounded-full"></div>
            </div>
          </div>

          {/* Error Score Widget */}
          {(dbUser?.errorScore || 0) > 0 && (
            <div className="md:col-span-5 bg-[color:var(--color-error-container)] border border-[color:var(--color-error)]/20 rounded-xl p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
              <div>
                <div className="flex items-center gap-2 text-[color:var(--color-error)] mb-2">
                  <span className="material-symbols-outlined">warning</span>
                  <span className="font-[family-name:var(--font-label-sm)] font-bold uppercase tracking-wider">
                    Action Required
                  </span>
                </div>
                <div className="text-[length:var(--text-display-lg)] font-[family-name:var(--font-display-lg)] text-[color:var(--color-on-error-container)]">
                  {dbUser?.errorScore || 0}
                </div>
                <p className="font-[family-name:var(--font-title-md)] text-[length:var(--text-title-md)] text-[color:var(--color-on-error-container)] font-semibold mt-1">
                  Error Points
                </p>
              </div>
              <div className="mt-4">
                <p className="text-[color:var(--color-on-error-container)] font-[family-name:var(--font-body-md)] opacity-80 mb-4">
                  Clearing your error debt is the fastest way to improve your placement score.
                </p>
                <Link href="/review" className="w-full bg-[color:var(--color-error)] text-[color:var(--color-on-error)] font-[family-name:var(--font-title-md)] text-[length:var(--text-title-md)] py-3 rounded-lg hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined">auto_fix_high</span>
                  Revise Errors
                </Link>
              </div>
            </div>
          )}
        </section>

        {hasClassroom && (
          <section className="bg-[color:var(--color-primary-container)] text-[color:var(--color-on-primary-container)] rounded-xl p-6 flex flex-col md:flex-row justify-between items-center shadow-sm">
            <div>
              <h3 className="font-[family-name:var(--font-title-md)] text-[length:var(--text-title-md)] font-bold">Ready to pick up where you left off?</h3>
              <p className="text-sm opacity-90 mt-1">Jump right back into your current module to keep your streak alive.</p>
            </div>
            <Link href={`/practice/${classroomLevel}`} className="mt-4 md:mt-0 bg-[color:var(--color-primary)] text-[color:var(--color-on-primary)] px-6 py-3 rounded-full font-bold shadow-sm hover:opacity-90 transition-opacity whitespace-nowrap">
              Continue Learning
            </Link>
          </section>
        )}

        {/* Module Selection Grid */}
        <section>
          <div className="flex items-center justify-between mb-[var(--spacing-gutter)]">
            <h3 className="font-[family-name:var(--font-headline-lg-mobile)] md:font-[family-name:var(--font-title-md)] text-[length:var(--text-headline-lg-mobile)] md:text-[length:var(--text-title-md)] text-[color:var(--color-primary)]">
              Curriculum Modules
            </h3>
            <button className="text-[color:var(--color-primary)] font-[family-name:var(--font-label-sm)] flex items-center gap-1 hover:underline">
              View All <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-[var(--spacing-base)] md:gap-[var(--spacing-gutter)]">
            {[
              { id: "Elementary", label: "Elementary", lessons: "12 Lessons" },
              { id: "PreIntermediate", label: "Pre-Intermediate", lessons: "8 Lessons" },
              { id: "Intermediate", label: "Intermediate", lessons: "24 Lessons" },
              { id: "UpperIntermediate", label: "Upper-Intermediate", lessons: "15 Lessons" },
              { id: "PreFac", label: "Pre-Faculty", lessons: "18 Lessons" },
            ].map((lvl, index, array) => {
              const currentIndex = array.findIndex(l => l.id === classroomLevel);
              const isAccessible = hasClassroom ? index <= currentIndex : false;
              const isCurrent = lvl.id === classroomLevel;
              
              if (!isAccessible && hasClassroom) return null; // Hide locked levels entirely

              return (
                <Link 
                  key={lvl.id} 
                  href={isAccessible ? `/practice/${lvl.id}` : "#"} 
                  className={isCurrent 
                    ? "bg-[color:var(--color-primary-container)] border-2 border-[color:var(--color-primary)] p-5 rounded-xl flex flex-col items-center text-center cursor-pointer shadow-sm relative overflow-hidden block"
                    : isAccessible 
                      ? "bg-[color:var(--color-surface-container-lowest)] border border-[color:var(--color-outline-variant)] p-5 rounded-xl flex flex-col items-center text-center cursor-pointer hover:border-[color:var(--color-primary)] transition-colors group"
                      : "bg-[color:var(--color-surface-container-low)] border border-[color:var(--color-outline-variant)] p-5 rounded-xl flex flex-col items-center text-center opacity-50 cursor-not-allowed"
                  }
                >
                  {isCurrent && (
                    <div className="absolute top-0 right-0 p-1 bg-[color:var(--color-secondary-container)] text-[color:var(--color-on-secondary-container)] text-[10px] font-bold px-2 rounded-bl">
                      CURRENT
                    </div>
                  )}
                  <span className={`material-symbols-outlined text-4xl ${isCurrent ? "text-[color:var(--color-on-primary-container)]" : "text-[color:var(--color-outline)] group-hover:text-[color:var(--color-primary)] transition-colors"}`}>
                    {isCurrent ? "folder_open" : isAccessible ? "folder" : "lock"}
                  </span>
                  <span className={`mt-3 font-[family-name:var(--font-title-md)] text-[length:var(--text-title-md)] ${isCurrent ? "text-[color:var(--color-on-primary-container)] font-bold" : "text-[color:var(--color-on-surface)]"}`}>
                    {lvl.label}
                  </span>
                  <span className={`text-[length:var(--text-label-sm)] ${isCurrent ? "text-[color:var(--color-on-primary-container)] opacity-80" : "text-[color:var(--color-on-surface-variant)]"}`}>
                    {isAccessible ? lvl.lessons : "Locked"}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Vocabulary Journal Widget */}
        <section className="bg-[color:var(--color-surface-container)] border border-[color:var(--color-outline-variant)] rounded-xl overflow-hidden relative min-h-[160px] flex items-center shadow-sm hover:shadow-md transition-all">
          <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden">
            <span className="material-symbols-outlined text-[200px] absolute -right-10 -bottom-10" style={{ fontVariationSettings: "'FILL' 0" }}>
              menu_book
            </span>
          </div>
          <div className="relative z-10 p-8 md:p-10 flex flex-col md:flex-row justify-between items-start md:items-center w-full gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-[color:var(--color-primary)]">import_contacts</span>
                <h3 className="font-[family-name:var(--font-headline-sm)] text-[length:var(--text-headline-sm)] text-[color:var(--color-primary)] font-bold">
                  Personal Vocabulary Journal
                </h3>
              </div>
              <p className="font-[family-name:var(--font-body-md)] text-[color:var(--color-on-surface-variant)] max-w-xl">
                Keep track of difficult words, write your own example sentences, and review your personal notes to master challenging vocabulary.
              </p>
            </div>
            <Link href="/journal" className="bg-[color:var(--color-primary)] text-[color:var(--color-on-primary)] font-[family-name:var(--font-title-md)] text-[length:var(--text-title-md)] font-semibold px-6 py-3 rounded-full flex items-center gap-2 hover:bg-[color:var(--color-primary-fixed)] transition-all shadow-sm active:scale-95 whitespace-nowrap">
              <span className="material-symbols-outlined">edit_document</span>
              Open Journal
            </Link>
          </div>
        </section>


      </main>


    </>
  );
}
