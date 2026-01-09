/**
 * Database Initialization Script
 * Run this script to set up the database collections and indexes
 */

import dotenv from 'dotenv';
import { initializeDatabase } from '../lib/db-init.js';

// Load environment variables from .env file
dotenv.config();

async function main() {
    try {
        console.log('🚀 Starting database initialization...');
        
        // Check required environment variables
        const requiredVars = ['MONGODB_URI', 'DB_NAME'];
        const missing = requiredVars.filter(varName => !process.env[varName]);
        
        if (missing.length > 0) {
            console.error(`❌ Missing required environment variables: ${missing.join(', ')}`);
            console.error('Please check your .env file and ensure all required variables are set.');
            process.exit(1);
        }
        
        console.log('✅ Environment variables validated');
        
        // Initialize database
        console.log('🗄️  Initializing database...');
        await initializeDatabase();
        console.log('✅ Database initialization completed successfully');
        
        console.log('🎉 Setup complete! Your Nexus ATS database is ready.');
        
    } catch (error) {
        console.error('❌ Database initialization failed:', error);
        process.exit(1);
    }
}

main();