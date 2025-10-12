// Simple script to test OpenAI API key
require('dotenv').config({ path: '.env.local' });

console.log('🔍 Testing OpenAI API Key...\n');

const apiKey = process.env.OPENAI_API_KEY;

console.log('API Key loaded:', !!apiKey);
console.log('API Key length:', apiKey?.length || 0);
console.log('API Key starts with:', apiKey?.substring(0, 20) || 'undefined');
console.log('Has whitespace:', apiKey?.includes('\n') || apiKey?.includes('\r') || apiKey?.includes(' ') || false);
console.log('Has backslash:', apiKey?.includes('\\') || false);

if (!apiKey) {
  console.error('❌ API key not found in environment!');
  process.exit(1);
}

// Try to make a simple API call
const OpenAI = require('openai');
const client = new OpenAI({ apiKey: apiKey.trim() });

(async () => {
  try {
    console.log('\n📡 Testing API connection...');
    const response = await client.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: 'Say "API key works!"' }],
      max_tokens: 10
    });
    console.log('✅ API Key is WORKING!');
    console.log('Response:', response.choices[0].message.content);
  } catch (error) {
    console.error('❌ API Key test FAILED:');
    console.error('Error:', error.message);
    console.error('Status:', error.status);
  }
})();
