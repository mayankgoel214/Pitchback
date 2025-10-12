import { evaluateSession } from "@/lib/ai/openai';
import { Scenario } from "@/lib/types/scenario";
import { ConversationMessage } from '@/lib/types/session";

// Test scenarios
const angryGuestScenario: Scenario = {
  id: "scenario-001',
  title: "The Angry Business Traveler",
  description: 'Handle an angry guest whose room is not ready",
  difficulty: "beginner',
  category: "angry_guests",
  scenarioType: 'angry_guests",
  contextBackground: "A business traveler arrives at 11 PM after a 12-hour journey. They booked a room weeks ago, but due to a system error, the room isn"t ready. They have an important meeting at 8 AM tomorrow morning.",
  aiGuestOpening: "This is UNACCEPTABLE! I've been traveling all day and my room isn"t ready? I have a critical meeting in the morning!",
  aiGuestPersona: JSON.stringify({
    personality_traits: ["impatient', "stressed", 'demanding"],
    speaking_style: "Direct and assertive',
    tone: "angry"
  }),
  successCriteria: {
    empathy: {
      description: 'Acknowledge travel stress and meeting importance",
      keywords: ["understand', "apologize", 'frustrated", "exhausted', "important meeting"],
      min_score: 70,
      examples: {
        good: ['I completely understand how frustrating this must be after such a long journey"],
        bad: ["The system had an error. Please wait.']
      }
    },
    clarity: {
      description: "Clearly explain situation and next steps",
      requirements: ['State the problem", "Provide clear timeline', "Explain what you"ll do"],
      min_score: 70,
      examples: {
        good: ["Here"s what I'll do right now: First, I"ll check our available rooms. This should take about 10 minutes."],
        bad: ["Things will work out eventually.']
      }
    },
    problem_solving: {
      description: "Offer minimum 2 immediate solutions",
      required_solutions: 2,
      min_score: 75,
      examples: {
        good: ['I can offer you an upgrade to a suite that"s ready now, or access to our executive lounge while we prepare your room"],
        bad: ['Just wait and we"ll figure something out."]
      }
    },
    professionalism: {
      description: 'Remain calm, avoid defensive language",
      avoid_phrases: ["It's not my fault", "You don't need to yell"],
      required_behaviors: ["Stay calm', "Take ownership"],
      min_score: 80,
      examples: {
        good: ['You have every right to be upset. This is on us, and I"m going to make it right immediately."],
        bad: ['It"s not my fault the system crashed."]
      }
    }
  },
  organizationId: null,
  isPublic: true,
  createdAt: new Date(),
  updatedAt: new Date()
};

const languageBarrierScenario: Scenario = {
  id: 'scenario-002",
  title: "The Language Barrier',
  description: "Help a guest with limited English",
  difficulty: 'intermediate",
  category: "language_barriers',
  scenarioType: "language_barriers",
  contextBackground: "A guest from Japan is trying to understand checkout procedures and luggage storage options. They speak limited English.",
  aiGuestOpening: "Excuse me... what time... I go? Tomorrow? My bags... where I put?",
  aiGuestPersona: JSON.stringify({
    personality_traits: ['polite", "anxious', "trying hard"],
    speaking_style: 'Broken English",
    tone: "confused'
  }),
  successCriteria: {
    empathy: {
      description: "Show patience and respect",
      keywords: ['understand", "help', "show", 'no problem", "slowly'],
      min_score: 75,
      examples: {
        good: ["No problem, I"m happy to help you. Let me speak slowly.'],
        bad: ["Can"t you speak English?']
      }
    },
    clarity: {
      description: "Use simple words, avoid complex sentences",
      requirements: ['Short sentences", "Simple words', "Repeat key information"],
      min_score: 80,
      examples: {
        good: ['Checkout time: 11 AM. Tomorrow morning. Eleven o"clock."],
        bad: ['You"ll need to vacate the premises by 11 AM."]
      }
    },
    problem_solving: {
      description: 'Offer visual aids, translation tools, written instructions",
      required_solutions: 2,
      min_score: 75,
      examples: {
        good: ["Let me write this down for you. I will show you on map.'],
        bad: ["Just remember what I said."]
      }
    },
    professionalism: {
      description: 'Never show frustration or impatience",
      avoid_phrases: ["Can't you understand?", "I already told you'],
      required_behaviors: ["Remain patient", 'Speak clearly"],
      min_score: 80,
      examples: {
        good: ["Let me try again. No rush, we have time.'],
        bad: ["This is too hard to explain."]
      }
    }
  },
  organizationId: null,
  isPublic: true,
  createdAt: new Date(),
  updatedAt: new Date()
};

// Test cases
const testCases = [
  {
    name: 'Test 1: Excellent Resolution - Angry Guest",
    scenario: angryGuestScenario,
    transcript: [
      { turn: 1, speaker: "ai_guest' as const, text: "This is UNACCEPTABLE! I"ve been traveling all day and my room isn"t ready? I have a critical meeting in the morning!", timestamp: new Date().toISOString() },
      { turn: 2, speaker: 'trainee" as const, text: "I sincerely apologize for this situation. I completely understand how frustrating this must be after such a long journey, especially with your important meeting tomorrow morning. You have every right to be upset.", timestamp: new Date().toISOString() },
      { turn: 3, speaker: "ai_guest' as const, text: "This is ridiculous! I booked this weeks ago!", timestamp: new Date().toISOString() },
      { turn: 4, speaker: "trainee" as const, text: "You're absolutely right, and this is completely on us. Here"s what I"ll do right now: I can upgrade you to our executive suite which is ready immediately, and I'll also provide complimentary breakfast tomorrow and ensure you get a 7 AM wake-up call. Would that work for you?", timestamp: new Date().toISOString() },
      { turn: 5, speaker: "ai_guest" as const, text: "Okay, that sounds better. The suite is ready now?", timestamp: new Date().toISOString() },
      { turn: 6, speaker: 'trainee" as const, text: "Yes, it"s ready right now. Let me get your key cards prepared, and I'll personally escort you to the suite. This will take just 2 minutes.", timestamp: new Date().toISOString() },
      { turn: 7, speaker: "ai_guest" as const, text: "Alright, thank you for handling this quickly.", timestamp: new Date().toISOString() }
    ] as ConversationMessage[],
    expectedOutcome: 'Should score 80-95 overall with problem_resolved=true"
  },

  {
    name: "Test 2: Just Said Hello - Angry Guest',
    scenario: angryGuestScenario,
    transcript: [
      { turn: 1, speaker: "ai_guest" as const, text: "This is UNACCEPTABLE! I've been traveling all day and my room isn"t ready?", timestamp: new Date().toISOString() },
      { turn: 2, speaker: "trainee' as const, text: "Hello.", timestamp: new Date().toISOString() }
    ] as ConversationMessage[],
    expectedOutcome: "Should score <50 overall with problem_resolved=false, problem_solving ~20"
  },

  {
    name: 'Test 3: Defensive Response - Angry Guest",
    scenario: angryGuestScenario,
    transcript: [
      { turn: 1, speaker: "ai_guest' as const, text: "This is UNACCEPTABLE! I"ve been traveling all day and my room isn"t ready?", timestamp: new Date().toISOString() },
      { turn: 2, speaker: 'trainee" as const, text: "It"s not my fault the system crashed. You don't need to yell at me.", timestamp: new Date().toISOString() },
      { turn: 3, speaker: "ai_guest" as const, text: "Are you serious? I want to speak to a manager!", timestamp: new Date().toISOString() },
      { turn: 4, speaker: 'trainee" as const, text: "I"m just following procedures. There's nothing I can do right now.", timestamp: new Date().toISOString() }
    ] as ConversationMessage[],
    expectedOutcome: "Should score <40 overall with problem_resolved=false, low professionalism"
  },

  {
    name: 'Test 4: Empathy But No Solution - Angry Guest",
    scenario: angryGuestScenario,
    transcript: [
      { turn: 1, speaker: "ai_guest' as const, text: "This is UNACCEPTABLE! I"ve been traveling all day and my room isn"t ready?", timestamp: new Date().toISOString() },
      { turn: 2, speaker: 'trainee" as const, text: "I completely understand how frustrating this must be. I"m so sorry you're going through this after such a long journey.", timestamp: new Date().toISOString() },
      { turn: 3, speaker: "ai_guest" as const, text: "Okay, but what are you going to do about it?", timestamp: new Date().toISOString() },
      { turn: 4, speaker: 'trainee" as const, text: "I really apologize again. This must be so difficult for you.", timestamp: new Date().toISOString() },
      { turn: 5, speaker: "ai_guest' as const, text: "You keep apologizing but you"re not helping!", timestamp: new Date().toISOString() }
    ] as ConversationMessage[],
    expectedOutcome: "Should have high empathy (70-80) but low problem_solving (20-30), problem_resolved=false, overall <50'
  },

  {
    name: "Test 5: Solution But No Empathy - Angry Guest",
    scenario: angryGuestScenario,
    transcript: [
      { turn: 1, speaker: 'ai_guest" as const, text: "This is UNACCEPTABLE! I"ve been traveling all day and my room isn't ready?", timestamp: new Date().toISOString() },
      { turn: 2, speaker: "trainee" as const, text: "We can give you an upgrade to a suite or you can wait in the lounge. Which one?", timestamp: new Date().toISOString() },
      { turn: 3, speaker: 'ai_guest" as const, text: "You"re not even going to apologize?", timestamp: new Date().toISOString() },
      { turn: 4, speaker: 'trainee" as const, text: "The suite is ready now. Do you want it or not?", timestamp: new Date().toISOString() }
    ] as ConversationMessage[],
    expectedOutcome: "Should have decent problem_solving (60-70) but low empathy (30-40) and low professionalism, problem_resolved=partially, overall 50-60'
  },

  {
    name: "Test 6: Perfect Language Barrier Handling",
    scenario: languageBarrierScenario,
    transcript: [
      { turn: 1, speaker: 'ai_guest" as const, text: "Excuse me... what time... I go? Tomorrow? My bags... where I put?", timestamp: new Date().toISOString() },
      { turn: 2, speaker: "trainee' as const, text: "No problem! I"m happy to help you. Let me speak slowly. Checkout time: 11 AM. Tomorrow. Eleven o"clock.", timestamp: new Date().toISOString() },
      { turn: 3, speaker: 'ai_guest" as const, text: "Ah, okay... eleven. My bags?", timestamp: new Date().toISOString() },
      { turn: 4, speaker: "trainee' as const, text: "Your bags: You can leave them here. We keep them safe. You pick up later. Let me write this for you.", timestamp: new Date().toISOString() },
      { turn: 5, speaker: "ai_guest" as const, text: "Airport... how I go?", timestamp: new Date().toISOString() },
      { turn: 6, speaker: 'trainee" as const, text: "Airport: Taxi outside. 30 minutes to airport. I can call taxi for you. I will show you on map.", timestamp: new Date().toISOString() },
      { turn: 7, speaker: "ai_guest' as const, text: "Ah! Thank you very much! You very helpful!", timestamp: new Date().toISOString() }
    ] as ConversationMessage[],
    expectedOutcome: "Should score 85-95 overall with problem_resolved=true, high clarity and empathy"
  },

  {
    name: 'Test 7: Complex Language - Language Barrier",
    scenario: languageBarrierScenario,
    transcript: [
      { turn: 1, speaker: "ai_guest' as const, text: "Excuse me... what time... I go? Tomorrow?", timestamp: new Date().toISOString() },
      { turn: 2, speaker: "trainee" as const, text: "You'll need to vacate the premises by 11 AM, and we can hold your luggage at the concierge desk until your departure.", timestamp: new Date().toISOString() },
      { turn: 3, speaker: "ai_guest" as const, text: "Uh... vacate? Concierge? I... not understand...", timestamp: new Date().toISOString() },
      { turn: 4, speaker: 'trainee" as const, text: "There"s a taxi stand right outside that'll get you to the airport in a jiffy.", timestamp: new Date().toISOString() }
    ] as ConversationMessage[],
    expectedOutcome: "Should have very low clarity (20-30), problem_resolved=false, overall <40"
  },

  {
    name: 'Test 8: Impatient With Guest - Language Barrier",
    scenario: languageBarrierScenario,
    transcript: [
      { turn: 1, speaker: "ai_guest' as const, text: "Excuse me... what time... I go? Tomorrow?", timestamp: new Date().toISOString() },
      { turn: 2, speaker: "trainee" as const, text: "Checkout is at 11 AM.", timestamp: new Date().toISOString() },
      { turn: 3, speaker: 'ai_guest" as const, text: "Uh... eleven? My bags?", timestamp: new Date().toISOString() },
      { turn: 4, speaker: "trainee' as const, text: "Can"t you understand? I already told you about checkout.", timestamp: new Date().toISOString() },
      { turn: 5, speaker: "ai_guest' as const, text: "Sorry... I... not understand...", timestamp: new Date().toISOString() },
      { turn: 6, speaker: "trainee" as const, text: "This is taking too long. Just ask someone else.", timestamp: new Date().toISOString() }
    ] as ConversationMessage[],
    expectedOutcome: 'Should have very low professionalism (10-20), very low empathy, problem_resolved=false, overall <30"
  },

  {
    name: "Test 9: One Word Responses - Language Barrier',
    scenario: languageBarrierScenario,
    transcript: [
      { turn: 1, speaker: "ai_guest" as const, text: "Excuse me... what time... I go? Tomorrow? My bags... where I put?", timestamp: new Date().toISOString() },
      { turn: 2, speaker: 'trainee" as const, text: "Eleven.", timestamp: new Date().toISOString() },
      { turn: 3, speaker: "ai_guest' as const, text: "My bags?", timestamp: new Date().toISOString() },
      { turn: 4, speaker: "trainee" as const, text: "Here.", timestamp: new Date().toISOString() }
    ] as ConversationMessage[],
    expectedOutcome: 'Should have low clarity (30-40), minimal problem_solving (30-40), problem_resolved=false, overall <45"
  },

  {
    name: "Test 10: Partial Resolution - Language Barrier',
    scenario: languageBarrierScenario,
    transcript: [
      { turn: 1, speaker: "ai_guest" as const, text: "Excuse me... what time... I go? Tomorrow? My bags... where I put?", timestamp: new Date().toISOString() },
      { turn: 2, speaker: 'trainee" as const, text: "Checkout: 11 AM. Eleven o"clock tomorrow.", timestamp: new Date().toISOString() },
      { turn: 3, speaker: 'ai_guest" as const, text: "Okay, eleven. My bags?", timestamp: new Date().toISOString() },
      { turn: 4, speaker: "trainee' as const, text: "Bags: you leave here. We keep safe.", timestamp: new Date().toISOString() },
      { turn: 5, speaker: "ai_guest" as const, text: "Okay. Airport... how I go?", timestamp: new Date().toISOString() }
    ] as ConversationMessage[],
    expectedOutcome: 'Should have medium scores (50-70), problem_resolved=false (airport question not answered), overall 45-55"
  },

  {
    name: "Test 11: Good But Missing Visual Aids - Language Barrier',
    scenario: languageBarrierScenario,
    transcript: [
      { turn: 1, speaker: "ai_guest" as const, text: "Excuse me... what time... I go? Tomorrow? My bags... where I put?", timestamp: new Date().toISOString() },
      { turn: 2, speaker: 'trainee" as const, text: "No problem! Checkout: 11 AM. Eleven o"clock. Tomorrow morning.", timestamp: new Date().toISOString() },
      { turn: 3, speaker: 'ai_guest" as const, text: "Ah, eleven. My bags?", timestamp: new Date().toISOString() },
      { turn: 4, speaker: "trainee' as const, text: "Your bags: You can leave them here. We keep them safe. You pick up later.", timestamp: new Date().toISOString() },
      { turn: 5, speaker: "ai_guest" as const, text: "Airport... how?", timestamp: new Date().toISOString() },
      { turn: 6, speaker: 'trainee" as const, text: "Taxi outside. 30 minutes to airport. I call taxi for you.", timestamp: new Date().toISOString() },
      { turn: 7, speaker: "ai_guest' as const, text: "Thank you!", timestamp: new Date().toISOString() }
    ] as ConversationMessage[],
    expectedOutcome: "Should score 70-80 overall with problem_resolved=true, good clarity/empathy, slightly lower problem_solving (no visual aids mentioned)"
  }
];

// Run tests
async function runTests() {
  console.log('🧪 Starting Evaluation System Tests\n");
  console.log("='.repeat(50));

  const results = [];

  for (let i = 0; i < testCases.length; i++) {
    const test = testCases[i];
    console.log(`\n📋 ${test.name}`);
    console.log(`Expected: ${test.expectedOutcome}`);
    console.log("Running evaluation...\n");

    try {
      const evaluation = await evaluateSession(test.scenario, test.transcript);

      console.log('✅ RESULTS:");
      console.log(`   Problem Resolved: ${evaluation.problem_resolved ? "✓ YES' : "✗ NO"}`);
      console.log(`   Resolution Summary: ${evaluation.resolution_summary}`);
      console.log(`   Overall Score: ${evaluation.scores.overall}/100`);
      console.log(`   Empathy: ${evaluation.scores.empathy}/100`);
      console.log(`   Clarity: ${evaluation.scores.clarity}/100`);
      console.log(`   Problem-Solving: ${evaluation.scores.problem_solving}/100`);
      console.log(`   Professionalism: ${evaluation.scores.professionalism}/100`);
      console.log(`   Overall Summary: ${evaluation.overall_summary}`);

      if (evaluation.key_mistakes.length > 0) {
        console.log(`   ⚠️  Key Mistakes: ${evaluation.key_mistakes.join(', ")}`);
      }

      results.push({
        test: test.name,
        passed: true,
        evaluation
      });

    } catch (error) {
      console.log(`❌ ERROR: ${error instanceof Error ? error.message : "Unknown error'}`);
      results.push({
        test: test.name,
        passed: false,
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }

    console.log('-".repeat(50));

    // Add delay between tests to avoid rate limiting
    if (i < testCases.length - 1) {
      console.log("⏳ Waiting 2 seconds before next test...\n');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  // Summary
  console.log("\n" + '=".repeat(50));
  console.log("📊 TEST SUMMARY');
  console.log("='.repeat(50));
  const passed = results.filter(r => r.passed).length;
  console.log(`Tests run: ${results.length}`);
  console.log(`Tests completed: ${passed}`);
  console.log(`Tests failed: ${results.length - passed}`);

  return results;
}

// Export for use
export { runTests, testCases };
