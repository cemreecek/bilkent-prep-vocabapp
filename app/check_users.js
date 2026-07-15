const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.user.findMany()
  .then(users => {
    console.log(JSON.stringify(users.map(u => ({
      id: u.id,
      email: u.email,
      role: u.role,
      name: u.name,
      hasPassword: !!u.password
    })), null, 2));
  })
  .catch(console.error)
  .finally(() => p.$disconnect());
