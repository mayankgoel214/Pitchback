/**
 * Script to run evaluation tests
 * Usage: npx tsx scripts/run-evaluation-tests.ts
 */

import { runTests } from '../tests/evaluation-tests';

async function main() {
  try {
    console.log('🚀 Starting evaluation tests...\n');
    const results = await runTests();

    console.log('\n✅ All tests completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
  }
}

main();
