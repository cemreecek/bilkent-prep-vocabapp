import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.email || session.user.role !== 'TEACHER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { email } = await request.json()

  if (!email || !email.endsWith('@ug.bilkent.edu.tr')) {
    return NextResponse.json({ error: 'Invalid Bilkent email' }, { status: 400 })
  }

  const teacher = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { taughtClasses: true },
  })

  if (!teacher?.taughtClasses || teacher.taughtClasses.length === 0) {
    return NextResponse.json({ error: 'No classroom assigned to this teacher' }, { status: 400 })
  }

  // Assuming teacher manages only one classroom for now
  const classroomId = teacher.taughtClasses[0].id

  const student = await prisma.user.findUnique({
    where: { email },
  })

  if (!student) {
    return NextResponse.json({ error: 'Student not found' }, { status: 404 })
  }

  if (student.role !== 'STUDENT') {
    return NextResponse.json({ error: 'User is not a student' }, { status: 400 })
  }

  if (student.classroomId) {
    return NextResponse.json({ error: 'Student already assigned to a class' }, { status: 400 })
  }

  await prisma.user.update({
    where: { id: student.id },
    data: { classroomId: classroomId },
  })

  return NextResponse.json({ message: 'Student assigned successfully' })
}