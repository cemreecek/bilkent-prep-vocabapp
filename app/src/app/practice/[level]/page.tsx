import { loadPracticeMaterials } from '@/lib/practiceLoader'
import PracticeSession from './PracticeSession'
import { notFound, redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const dynamic = 'force-dynamic'

export default async function PracticeLevelPage({ params }: { params: Promise<{ level: string }> }) {
  const resolvedParams = await params;
  const level = resolvedParams.level;
  
  // Validate level string
  if (!['Elementary', 'PreIntermediate', 'Intermediate', 'UpperIntermediate', 'PreFac'].includes(level)) {
    notFound()
  }

  // Security Check: Enforce level assignment
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    redirect('/auth/signin')
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { role: true, level: true }
  })

  if (!user) {
    redirect('/auth/signin')
  }

  // Students can only access their assigned level
  // TEMPORARILY DISABLED FOR TESTING
  // if (user.role === 'STUDENT' && user.level !== level) {
  //   redirect('/practice') // Redirect back to dashboard if they try to access another level
  // }

  // Fetch available weeks/sets for this level from the database
  const availableWeeks = await prisma.practiceQuestion.findMany({
    where: { list: { level: level as any } },
    select: { week: true },
    distinct: ['week'],
    orderBy: { week: 'asc' }
  })

  console.log("FETCHING WEEKS FOR LEVEL:", level, "FOUND:", availableWeeks.length)

  const weeks = availableWeeks.map(w => w.week)

  return <PracticeSession level={level} availableWeeks={weeks} isAdmin={user.role === 'ADMIN'} />
}
