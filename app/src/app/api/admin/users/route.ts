import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.email || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const users = await prisma.user.findMany({
    orderBy: [{ role: 'desc' }, { email: 'asc' }],
    include: {
      classroom: true,
    },
  })

  return NextResponse.json(users)
}

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.email || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { userId, role, level } = await request.json()

  if (role && !['STUDENT', 'TEACHER', 'ADMIN'].includes(role)) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
  }

  if (level && !['Elementary', 'Intermediate', 'Pin', 'Prefac', 'Upper'].includes(level)) {
    return NextResponse.json({ error: 'Invalid level' }, { status: 400 })
  }

  await prisma.user.update({
    where: { id: userId },
    data: { 
      ...(role && { role }), 
      ...(level !== undefined && { level: level === '' ? null : level }) 
    },
  })

  return NextResponse.json({ message: 'User updated' })
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.email || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { userId } = await request.json()

  await prisma.user.delete({
    where: { id: userId },
  })

  return NextResponse.json({ message: 'User deleted' })
}