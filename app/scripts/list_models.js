const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config({ path: require('path').join(__dirname, "../.env") });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function list() {
  try {
      const { models } = await (genAI.requestOptions ? genAI : new GoogleGenerativeAI(process.env.GEMINI_API_KEY)); // depending on SDK ver
      // Wait, in older SDK, listModels doesn't exist. Let's just fetch directly using fetch
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
      const data = await response.json();
      if (data.models) {
          data.models.forEach(m => console.log(m.name));
      } else {
          console.log(data);
      }
  } catch(e) {
      console.error(e);
  }
}
list();
