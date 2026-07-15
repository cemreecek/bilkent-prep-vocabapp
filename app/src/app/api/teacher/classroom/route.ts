import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.email || session.user.role !== 'TEACHER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const teacher = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      taughtClasses: {
        include: {
          students: {
            include: {
              streaks: true,
              errorLogs: true,
            },
          },
        },
      },
    },
  })

  if (!teacher?.taughtClasses || teacher.taughtClasses.length === 0) {
    return NextResponse.json({ error: 'No classroom found' }, { status: 404 })
  }

  return NextResponse.json(teacher.taughtClasses[0])
}