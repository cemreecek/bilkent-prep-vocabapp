fetch('http://localhost:3000/api/flashcards?level=UpperIntermediate&week=6&day=1')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);
