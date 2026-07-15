const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.practiceQuestion.findMany({ select: { list: { select: { level: true } }, week: true }, distinct: ['week', 'listId'] })
  .then(res => { console.log(res); process.exit(0); });
