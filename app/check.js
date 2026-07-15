const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const words = await prisma.vocabWord.findMany({
    include: { list: true }
  });

  const upper = words.filter(w => w.list.level === 'UpperIntermediate' && w.list.unit !== 'Unit 1');
  const upperByWeek = {};
  upper.forEach(w => {
    if (!upperByWeek[w.week]) upperByWeek[w.week] = new Set();
    upperByWeek[w.week].add(w.day);
  });
  console.log("UpperIntermediate Weeks & Days:", Object.fromEntries(
    Object.entries(upperByWeek).map(([k,v]) => [k, [...v].sort((a,b)=>a-b)])
  ));

  const prefac = words.filter(w => w.list.level === 'PreFac' && w.list.unit !== 'Unit 1');
  const prefacByWeek = {};
  prefac.forEach(w => {
    if (!prefacByWeek[w.week]) prefacByWeek[w.week] = new Set();
    prefacByWeek[w.week].add(w.day);
  });
  console.log("PreFac Weeks & Days:", Object.fromEntries(
    Object.entries(prefacByWeek).map(([k,v]) => [k, [...v].sort((a,b)=>a-b)])
  ));
}
main().catch(console.error);
