import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import bcrypt from 'bcryptjs'

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'TEACHER') {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { id } = await params
    const body = await req.json()
    const { name, email, newPassword } = body

    const updateData: any = { name, email }
    
    if (newPassword && newPassword.trim() !== '') {
      updateData.password = await bcrypt.hash(newPassword, 12)
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: { id: true, name: true, email: true, role: true } // Don't return password hash
    })

    return NextResponse.json(updatedUser)
  } catch (error: any) {
    console.error('Error updating student:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
