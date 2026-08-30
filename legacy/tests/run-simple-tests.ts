/**
 * Simplified test runner for evaluation system
 * Run with: npx tsx tests/run-simple-tests.ts
 */

// MUST load environment variables FIRST before any other imports
require('dotenv').config({ path: '.env.local' });

import { evaluateSession } from '../lib/ai/openai';
import type { Scenario } from '../lib/types/scenario';
import type { ConversationMessage } from '../lib/types/session';

// Create test scenario
const testScenario: Scenario = {
  id: 'test-001',
  title: 'Test Angry Guest Scenario',
  description: 'Testing evaluation system',
  difficulty: 'beginner',
  category: 'angry_guests',
  scenarioType: 'angry_guests',
  contextBackground: "A business traveler arrives late and their room isn't ready. They have an important meeting tomorrow.",
  aiGuestOpening: "This is unacceptable! My room isn't ready!",
  aiGuestPersona: JSON.stringify({
    personality_traits: ['impatient', 'stressed'],
    speaking_style: 'Direct',
    tone: 'angry'
  }),
  success_criteria: {
    empathy: {
      description: 'Show understanding',
      keywords: ['understand', 'apologize'],
      min_score: 70,
      examples: { good: ['I understand your frustration'], bad: ['Not my problem'] }
    },
    clarity: {
      description: 'Be clear',
      requirements: ['Explain situation'],
      min_score: 70,
      examples: { good: ['Here is what I will do'], bad: ['Maybe something'] }
    },
    problem_solving: {
      description: 'Offer solutions',
      required_solutions: 2,
      min_score: 75,
      examples: { good: ['Upgrade or lounge access'], bad: ['Wait'] }
    },
    professionalism: {
      description: 'Stay calm',
      avoid_phrases: ['Not my fault'],
      required_behaviors: ['Stay calm'],
      min_score: 80,
      examples: { good: ['I will help you'], bad: ['Not my fault'] }
    }
  },
  organizationId: null,
  isPublic: true,
  createdAt: new Date(),
  updatedAt: new Date()
};

// Test cases
const tests = [
  {
    name: 'Test 1: Excellent handling with full resolution',
    transcript: [
      { turn: 1, speaker: 'ai_guest' as const, text: "This is unacceptable! My room is not ready!", timestamp: new Date().toISOString() },
      { turn: 2, speaker: 'trainee' as const, text: "I sincerely apologize. I completely understand your frustration after traveling. Let me upgrade you to our executive suite immediately, and provide complimentary breakfast.", timestamp: new Date().toISOString() },
      { turn: 3, speaker: 'ai_guest' as const, text: "Okay, that sounds better.", timestamp: new Date().toISOString() }
    ] as ConversationMessage[],
    expected: 'High scores 80-95, problem_resolved=true'
  },
  {
    name: 'Test 2: Just said hello - minimal effort',
    transcript: [
      { turn: 1, speaker: 'ai_guest' as const, text: "This is unacceptable! My room is not ready!", timestamp: new Date().toISOString() },
      { turn: 2, speaker: 'trainee' as const, text: "Hello.", timestamp: new Date().toISOString() }
    ] as ConversationMessage[],
    expected: 'Low scores <50, problem_resolved=false, problem_solving ~20'
  },
  {
    name: 'Test 3: Defensive and unprofessional',
    transcript: [
      { turn: 1, speaker: 'ai_guest' as const, text: "This is unacceptable! My room is not ready!", timestamp: new Date().toISOString() },
      { turn: 2, speaker: 'trainee' as const, text: "Not my fault. The system crashed.", timestamp: new Date().toISOString() },
      { turn: 3, speaker: 'ai_guest' as const, text: "I want to speak to a manager!", timestamp: new Date().toISOString() }
    ] as ConversationMessage[],
    expected: 'Low professionalism, problem_resolved=false'
  },
  {
    name: 'Test 4: Empathy but no solution',
    transcript: [
      { turn: 1, speaker: 'ai_guest' as const, text: "My room is not ready!", timestamp: new Date().toISOString() },
      { turn: 2, speaker: 'trainee' as const, text: "I completely understand how frustrating this must be. I am so sorry.", timestamp: new Date().toISOString() },
      { turn: 3, speaker: 'ai_guest' as const, text: "What are you going to do about it?", timestamp: new Date().toISOString() },
      { turn: 4, speaker: 'trainee' as const, text: "I really apologize again.", timestamp: new Date().toISOString() }
    ] as ConversationMessage[],
    expected: 'High empathy 70-80, low problem_solving 20-30, problem_resolved=false'
  },
  {
    name: 'Test 5: Solution but no empathy',
    transcript: [
      { turn: 1, speaker: 'ai_guest' as const, text: "My room is not ready!", timestamp: new Date().toISOString() },
      { turn: 2, speaker: 'trainee' as const, text: "Upgrade to suite or wait in lounge. Which one?", timestamp: new Date().toISOString() },
      { turn: 3, speaker: 'ai_guest' as const, text: "No apology?", timestamp: new Date().toISOString() }
    ] as ConversationMessage[],
    expected: 'Low empathy 30-40, decent problem_solving 60-70'
  }
];

// Run tests
async function runTests() {
  console.log('🧪 Evaluation System Tests\n');
  console.log('='.repeat(60));

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    console.log(`\n📋 ${test.name}`);
    console.log(`Expected: ${test.expected}`);
    console.log('Running...\n');

    try {
      const evaluation = await evaluateSession(testScenario, test.transcript);

      console.log('✅ RESULTS:');
      console.log(`   Problem Resolved: ${evaluation.problem_resolved ? '✓ YES' : '✗ NO'}`);
      console.log(`   Resolution: ${evaluation.resolution_summary}`);
      console.log(`   Overall Score: ${evaluation.scores.overall}/100`);
      console.log(`   - Empathy: ${evaluation.scores.empathy}/100`);
      console.log(`   - Clarity: ${evaluation.scores.clarity}/100`);
      console.log(`   - Problem-Solving: ${evaluation.scores.problem_solving}/100`);
      console.log(`   - Professionalism: ${evaluation.scores.professionalism}/100`);

      if (evaluation.key_mistakes?.length > 0) {
        console.log(`   ⚠️  Mistakes: ${evaluation.key_mistakes.join(', ')}`);
      }

      passed++;
    } catch (error) {
      console.log(`❌ ERROR: ${error instanceof Error ? error.message : 'Unknown'}`);
      failed++;
    }

    console.log('-'.repeat(60));

    // Delay to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total: ${tests.length} tests`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
}

runTests().then(() => {
  console.log('\n✅ Tests complete');
  process.exit(0);
}).catch((error) => {
  console.error('\n❌ Test suite failed:', error);
  process.exit(1);
});
