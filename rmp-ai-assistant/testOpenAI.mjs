import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();  // Load environment variables from .env file

const apiKey = process.env.OPENAI_API_KEY;
console.log('API Key:', apiKey);  // Debugging line

async function testOpenAI() {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'Say hello to the world!' }],
        max_tokens: 5,
      }),
    });

    const data = await response.json();
    console.log('API response:', data);
  } catch (error) {
    console.error('Error with OpenAI API:', error);
  }
}

testOpenAI();