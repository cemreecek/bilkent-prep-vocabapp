const q = 'help _______________(1) less greenhouse ... {2} test (3) ... _________ {4}';
const regex = /(?:_{3,}\s*)?(?:\{|\()(\d+)(?:\}|\))/g;
console.log(q.split(regex));
