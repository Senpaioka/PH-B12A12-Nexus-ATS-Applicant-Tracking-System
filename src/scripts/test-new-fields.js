/**
 * Test New Fields Script
 * Tests the user registration with bio and photoURL fields
 */

import dotenv from 'dotenv';
import { registerUser } from '../lib/auth/registration.js';

// Load environment variables
dotenv.config();

async function testNewFields() {
    try {
        console.log('🧪 Testing user registration with new fields...');
        
        const testUser = {
            email: 'testuser2@example.com',
            password: 'TestPassword123!',
            name: 'Test User 2',
            bio: 'This is a comprehensive test biography for the user registration system that contains exactly the required number of words to meet the minimum requirement for the bio field validation. The biography describes the professional background, personal interests, and career aspirations of the user in detail. This person has extensive experience in software development, particularly in modern web technologies like React, Node.js, MongoDB, PostgreSQL, and various cloud platforms including AWS, Azure, and Google Cloud Platform. They have worked on numerous projects ranging from small startup applications to large-scale enterprise systems that serve millions of users worldwide and handle complex business logic. Throughout their career, they have demonstrated expertise in full-stack development, database design, API architecture, microservices architecture, DevOps practices, and user experience optimization. In their spare time, they enjoy reading technical blogs, contributing to open source projects, learning new programming languages, attending tech conferences, participating in hackathons, and mentoring junior developers. They are passionate about creating user-friendly applications that solve real-world problems and make a positive impact on people lives through innovative technology solutions. Their goal is to continue growing as a developer while helping others learn and succeed in the technology industry. They believe strongly in the power of collaboration, knowledge sharing, continuous learning, and building inclusive tech communities that welcome developers from all backgrounds. They are always eager to share their expertise with fellow developers and contribute to the broader tech community through blog posts, tutorials, open source contributions, and speaking engagements at conferences and meetups. This biography serves as a comprehensive introduction to their background, technical skills, leadership experience, and future aspirations in the field of technology and software development. They are committed to staying current with industry trends, best practices, emerging technologies, and maintaining a growth mindset throughout their entire professional career journey in the technology field.',
            photoURL: 'https://example.com/photo.jpg'
        };
        
        console.log(`📝 Registering user: ${testUser.email}`);
        console.log(`📸 Photo URL: ${testUser.photoURL}`);
        console.log(`📄 Bio word count: ${testUser.bio.split(/\s+/).length} words`);
        
        const result = await registerUser(testUser.email, testUser.password, { 
            name: testUser.name,
            bio: testUser.bio,
            photoURL: testUser.photoURL
        });
        
        console.log('✅ Registration successful!');
        console.log('User details:', {
            id: result.id,
            email: result.email,
            name: result.name,
            bio: result.bio ? `${result.bio.substring(0, 100)}...` : null,
            photoURL: result.photoURL,
            role: result.role,
            createdAt: result.createdAt
        });
        
        console.log('🎉 New fields test completed successfully!');
        
    } catch (error) {
        console.error('❌ New fields test failed:', error.message);
        process.exit(1);
    }
}

testNewFields();