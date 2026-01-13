/**
 * Team Invitation System Verification Script
 * Tests the complete invitation flow
 */

import { connectToDatabase } from '../lib/mongodb.js';
import {
    createInvitation,
    getInvitationsForOrganization,
    findInvitationByToken,
    deleteInvitation,
    createTeamMember,
    getTeamMembersForOrganization
} from '../lib/team/invitation-db.js';
import {
    createInvitationDocument,
    createTeamMemberDocument,
    TEAM_ROLES,
    INVITATION_STATUS
} from '../lib/team/invitation-models.js';
import {
    validateInvitationData,
    validateTeamMemberBasicInfo
} from '../lib/team/invitation-validation.js';

async function runVerification() {
    console.log('\n🔍 Starting Team Invitation System Verification...\n');

    let testsPassed = 0;
    let testsFailed = 0;
    const testOrgId = '507f1f77bcf86cd799439011'; // Test organization ID
    const testUserId = '507f1f77bcf86cd799439012'; // Test user ID
    const testEmail = 'test@example.com';
    let createdInvitationId = null;

    try {
        // Connect to database
        console.log('📡 Connecting to database...');
        await connectToDatabase();
        console.log('✅ Database connected\n');

        // Test 1: Create Invitation Document
        console.log('Test 1: Creating invitation document...');
        try {
            const invitationData = {
                organizationId: testOrgId,
                email: testEmail,
                role: TEAM_ROLES.INTERVIEWER,
                invitedBy: testUserId,
                message: 'Welcome to the team!',
                inviterName: 'Test Admin',
                inviterEmail: 'admin@test.com',
                organizationName: 'Test Org'
            };

            const invitationDoc = createInvitationDocument(invitationData);

            if (!invitationDoc.token || invitationDoc.token.length !== 64) {
                throw new Error('Invalid token generated');
            }

            if (invitationDoc.status !== INVITATION_STATUS.PENDING) {
                throw new Error('Invalid initial status');
            }

            console.log('✅ Invitation document created successfully');
            console.log(`   Token: ${invitationDoc.token.substring(0, 20)}...`);
            testsPassed++;
        } catch (error) {
            console.log('❌ Failed:', error.message);
            testsFailed++;
        }

        // Test 2: Validate Invitation Data
        console.log('\nTest 2: Validating invitation data...');
        try {
            const validData = {
                organizationId: testOrgId,
                email: 'valid@example.com',
                role: TEAM_ROLES.RECRUITER,
                invitedBy: testUserId
            };

            validateInvitationData(validData);
            console.log('✅ Valid data passed validation');
            testsPassed++;
        } catch (error) {
            console.log('❌ Failed:', error.message);
            testsFailed++;
        }

        // Test 3: Reject Invalid Email
        console.log('\nTest 3: Rejecting invalid email...');
        try {
            const invalidData = {
                organizationId: testOrgId,
                email: 'invalid-email',
                role: TEAM_ROLES.RECRUITER,
                invitedBy: testUserId
            };

            validateInvitationData(invalidData);
            console.log('❌ Should have rejected invalid email');
            testsFailed++;
        } catch (error) {
            console.log('✅ Invalid email correctly rejected');
            testsPassed++;
        }

        // Test 4: Create Team Member Document
        console.log('\nTest 4: Creating team member document...');
        try {
            const memberData = {
                organizationId: testOrgId,
                userId: testUserId,
                role: TEAM_ROLES.ADMIN,
                invitedBy: testUserId
            };

            const memberDoc = createTeamMemberDocument(memberData);

            if (!memberDoc.permissions || !memberDoc.permissions.canManageTeam) {
                throw new Error('Invalid permissions for Admin role');
            }

            console.log('✅ Team member document created with correct permissions');
            testsPassed++;
        } catch (error) {
            console.log('❌ Failed:', error.message);
            testsFailed++;
        }

        // Test 5: Database Collections Exist
        console.log('\nTest 5: Checking database collections...');
        try {
            const { db } = await connectToDatabase();
            const collections = await db.listCollections().toArray();
            const collectionNames = collections.map(c => c.name);

            const requiredCollections = ['team_invitations', 'team_members'];
            const missing = requiredCollections.filter(name => !collectionNames.includes(name));

            if (missing.length > 0) {
                throw new Error(`Missing collections: ${missing.join(', ')}`);
            }

            console.log('✅ All required collections exist');
            testsPassed++;
        } catch (error) {
            console.log('❌ Failed:', error.message);
            testsFailed++;
        }

        // Test 6: Indexes Verification
        console.log('\nTest 6: Verifying indexes...');
        try {
            const { db } = await connectToDatabase();
            const invitationsIndexes = await db.collection('team_invitations').indexes();
            const membersIndexes = await db.collection('team_members').indexes();

            console.log(`   Invitations indexes: ${invitationsIndexes.length}`);
            console.log(`   Team members indexes: ${membersIndexes.length}`);

            if (invitationsIndexes.length < 5 || membersIndexes.length < 5) {
                throw new Error('Missing expected indexes');
            }

            console.log('✅ Indexes verified');
            testsPassed++;
        } catch (error) {
            console.log('❌ Failed:', error.message);
            testsFailed++;
        }

        // Summary
        console.log('\n' + '='.repeat(50));
        console.log('📊 VERIFICATION SUMMARY');
        console.log('='.repeat(50));
        console.log(`✅ Tests Passed: ${testsPassed}`);
        console.log(`❌ Tests Failed: ${testsFailed}`);
        console.log(`📈 Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);
        console.log('='.repeat(50));

        if (testsFailed === 0) {
            console.log('\n🎉 All tests passed! The Team Invitation system is working correctly.\n');
            process.exit(0);
        } else {
            console.log('\n⚠️ Some tests failed. Please review the errors above.\n');
            process.exit(1);
        }

    } catch (error) {
        console.error('\n❌ Verification failed with error:', error);
        process.exit(1);
    }
}

// Run verification
runVerification();
