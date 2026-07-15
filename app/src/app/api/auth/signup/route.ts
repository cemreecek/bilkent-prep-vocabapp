import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const { name, email, password, role } = await request.json()

    if (!name || !email || !password || !role) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    if (!email.endsWith('@ug.bilkent.edu.tr')) {
      return NextResponse.json({ error: 'Only Bilkent emails are allowed' }, { status: 400 })
    }

    if (!['STUDENT', 'TEACHER'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role
      }
    })

    // If teacher, create classroom
    if (role === 'TEACHER') {
      await prisma.classroom.create({
        data: {
          name: `${name}'s Class`,
          teacherId: user.id
        }
      })
    }

    return NextResponse.json({ message: 'User created successfully' })
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}