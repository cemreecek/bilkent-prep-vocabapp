import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

async function run() {
  console.log("Using API Key:", apiKey.substring(0, 10) + "...");
  try {
    // There is no direct ListModels in the JS SDK's main class easily accessible without REST,
    // so let's try a direct fetch request to the REST API to see what models exist.
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.models) {
      console.log("Available Models:");
      data.models.forEach(m => console.log(m.name));
    } else {
      console.log("Error fetching models:", data);
    }
  } catch (e) {
    console.error(e);
  }
}

run();
