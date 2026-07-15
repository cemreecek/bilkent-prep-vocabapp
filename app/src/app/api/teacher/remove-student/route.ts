import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.email || session.user.role !== 'TEACHER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { studentId } = await request.json()

  const teacher = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { taughtClasses: true },
  })

  if (!teacher?.taughtClasses || teacher.taughtClasses.length === 0) {
    return NextResponse.json({ error: 'No classroom found' }, { status: 404 })
  }

  const classroomId = teacher.taughtClasses[0].id
  const student = await prisma.user.findUnique({
    where: { id: studentId },
  })

  if (!student || student.classroomId !== classroomId) {
    return NextResponse.json({ error: 'Student not in your class' }, { status: 404 })
  }

  await prisma.user.update({
    where: { id: student.id },
    data: { classroomId: null },
  })

  return NextResponse.json({ message: 'Student removed successfully' })
}