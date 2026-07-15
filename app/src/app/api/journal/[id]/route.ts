import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params
  const id = resolvedParams.id

  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Ensure the entry belongs to the user
    const entry = await prisma.journalEntry.findUnique({
      where: { id: id }
    })

    if (!entry || entry.userId !== session.user.id) {
      return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 404 })
    }

    await prisma.journalEntry.delete({
      where: { id: id }
    })

    return NextResponse.json({ message: 'Deleted successfully' })
  } catch (error) {
    console.error('Error deleting journal entry:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
