/**
 * Cleanup Expired Verification Tokens
 * Removes expired verification tokens from the database
 */

import { cleanupExpiredTokens } from '../lib/auth/verification.js';
import { connectToDatabase } from '../lib/mongodb.js';

async function runCleanup() {
  try {
    console.log('🧹 Starting cleanup of expired verification tokens...\n');

    // Connect to database
    await connectToDatabase();
    console.log('✅ Connected to database');

    // Clean up expired tokens
    const cleanedCount = await cleanupExpiredTokens();
    
    console.log(`\n✅ Cleanup completed successfully!`);
    console.log(`📊 Cleaned up ${cleanedCount} expired verification tokens`);
    
    if (cleanedCount === 0) {
      console.log('🎉 No expired tokens found - database is clean!');
    }

  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  }
}

// Run the cleanup
runCleanup();