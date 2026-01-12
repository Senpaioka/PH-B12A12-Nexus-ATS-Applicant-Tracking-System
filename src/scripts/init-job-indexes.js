#!/usr/bin/env node

/**
 * Database Index Initialization Script
 * Run this script to create optimized indexes for the jobs collection
 * 
 * Usage:
 *   node src/scripts/init-job-indexes.js
 */

import { ensureJobIndexes, listJobIndexes } from '../lib/jobs/job-indexes.js';

async function main() {
  try {
    console.log('🚀 Initializing job collection indexes...');
    
    // Create all necessary indexes
    await ensureJobIndexes();
    
    console.log('✅ Job indexes initialized successfully');
    
    // List all current indexes
    console.log('\n📋 Current indexes:');
    await listJobIndexes();
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Failed to initialize job indexes:', error.message);
    process.exit(1);
  }
}

// Run the script
main();