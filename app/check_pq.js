const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const pq = await prisma.practiceQuestion.findMany({ where: { list: { level: 'UpperIntermediate' } } });
  const weeks = [...new Set(pq.map(q => q.week))].sort();
  console.log("Upper Practice Weeks:", weeks);
  
  const pqPre = await prisma.practiceQuestion.findMany({ where: { list: { level: 'PreFac' } } });
  console.log("PreFac Practice Weeks:", [...new Set(pqPre.map(q=>q.week))].sort());
}
main().catch(console.error);
