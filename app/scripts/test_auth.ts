import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const email = 'admin@bilkent.edu.tr'
  const password = 'Admin@123'
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    console.log('User not found')
    return
  }
  const isMatch = await bcrypt.compare(password, user.password)
  console.log('Password Match:', isMatch)
}

main().finally(() => prisma.$disconnect())
