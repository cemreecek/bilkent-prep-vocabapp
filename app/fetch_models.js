const fs = require('fs');
const dotenv = require('dotenv');
dotenv.config({ path: '.env' });
const key = process.env.GEMINI_API_KEY;
fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`)
  .then(res => res.json())
  .then(data => {
    if (data.models) console.log(data.models.map(m => m.name).join('\n'));
    else console.log(data);
  });
