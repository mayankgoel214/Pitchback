/**
 * Simple test script to verify OpenAI API key is working
 * Run with: node test-openai.js
 */

// Load environment variables from .env.local
const fs = require('fs');
const path = require('path');

// Read .env.local file
const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

// Parse and set environment variables
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=:#]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    const value = match[2].trim();
    process.env[key] = value;
  }
});

// Import OpenAI
const OpenAI = require('openai').default;

// Initialize client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Test the API
async function testOpenAI() {
  console.log('Testing OpenAI API connection...\n');
  console.log('API Key (first 10 chars):', process.env.OPENAI_API_KEY?.substring(0, 10) + '...\n');

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Say "Hello! The API key is working correctly." in a friendly way.' }
      ],
      max_tokens: 50,
    });

    console.log('✅ SUCCESS! OpenAI API is working correctly.\n');
    console.log('Response from OpenAI:');
    console.log(completion.choices[0].message.content);
    console.log('\n✅ Your API key is properly configured and functional.');

  } catch (error) {
    console.error('❌ ERROR: Failed to connect to OpenAI API\n');
    console.error('Error message:', error.message);

    if (error.status === 401) {
      console.error('\n🔑 The API key appears to be invalid or expired.');
      console.error('Please check your .env.local file and ensure the OPENAI_API_KEY is correct.');
    } else if (error.status === 429) {
      console.error('\n⚠️  Rate limit exceeded or quota exceeded.');
      console.error('Please check your OpenAI account billing and usage limits.');
    } else {
      console.error('\n⚠️  An unexpected error occurred.');
    }
  }
}

testOpenAI();
