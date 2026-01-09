/**
 * Test Registration Script
 * Tests the user registration functionality
 */

import dotenv from 'dotenv';
import { registerUser } from '../lib/auth/registration.js';

// Load environment variables
dotenv.config();

async function testRegistration() {
    try {
        console.log('🧪 Testing user registration...');
        
        const testUser = {
            email: 'test@example.com',
            password: 'TestPassword123!',
            name: 'Test User'
        };
        
        console.log(`📝 Registering user: ${testUser.email}`);
        
        const result = await registerUser(testUser.email, testUser.password, { name: testUser.name });
        
        console.log('✅ Registration successful!');
        console.log('User details:', {
            id: result.id,
            email: result.email,
            name: result.name,
            role: result.role,
            createdAt: result.createdAt
        });
        
        console.log('🎉 Registration test completed successfully!');
        
    } catch (error) {
        console.error('❌ Registration test failed:', error.message);
        process.exit(1);
    }
}

testRegistration();