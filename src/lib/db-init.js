/**
 * Database Initialization Utility
 * Sets up collections, indexes, and constraints for the Nexus ATS database
 */

import { connectToDatabase, getUsersCollection, getInvitationsCollection, getTeamMembersCollection } from './mongodb.js';
import { INVITATION_INDEXES, TEAM_MEMBER_INDEXES } from './team/invitation-models.js';

/**
 * User document schema validation
 * Defines the structure and constraints for user documents
 */
const userSchema = {
  $jsonSchema: {
    bsonType: 'object',
    required: ['email', 'createdAt'],
    properties: {
      email: {
        bsonType: 'string',
        pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
        description: 'Must be a valid email address'
      },
      password: {
        bsonType: ['string', 'null'],
        description: 'Must be a hashed password string with minimum 8 characters, or null for OAuth users'
      },
      name: {
        bsonType: 'string',
        description: 'Optional user display name'
      },
      bio: {
        bsonType: ['string', 'null'],
        minLength: 300,
        maxLength: 500,
        description: 'User biography (300-500 words)'
      },
      photoURL: {
        bsonType: ['string', 'null'],
        description: 'URL to user profile photo (including Google profile URLs)'
      },
      role: {
        bsonType: 'string',
        enum: ['user', 'admin', 'recruiter', 'manager'],
        description: 'User role for access control'
      },
      createdAt: {
        bsonType: 'date',
        description: 'Account creation timestamp'
      },
      updatedAt: {
        bsonType: 'date',
        description: 'Last update timestamp'
      },
      isActive: {
        bsonType: 'bool',
        description: 'Whether the user account is active'
      },
      lastLoginAt: {
        bsonType: 'date',
        description: 'Last login timestamp'
      },
      emailVerified: {
        bsonType: 'bool',
        description: 'Whether the email address has been verified'
      },
      provider: {
        bsonType: 'string',
        enum: ['credentials', 'google'],
        description: 'Authentication provider used'
      },
      googleId: {
        bsonType: 'string',
        description: 'Google OAuth user ID'
      }
    }
  }
};

/**
 * Creates the users collection with proper validation and indexes
 * @returns {Promise<void>}
 */
export async function createUsersCollection() {
  try {
    const db = await connectToDatabase();

    // Check if collection already exists
    const collections = await db.listCollections({ name: 'users' }).toArray();

    if (collections.length === 0) {
      console.log('Creating users collection...');

      // Create collection with schema validation
      await db.createCollection('users', {
        validator: userSchema
      });

      console.log('Users collection created successfully');
    } else {
      console.log('Users collection already exists');
    }

    // Create indexes regardless (createIndex is idempotent)
    await createUserIndexes();

  } catch (error) {
    console.error('Failed to create users collection:', error);
    throw new Error(`Database initialization failed: ${error.message}`);
  }
}

/**
 * Creates all necessary indexes for the users collection
 * @returns {Promise<void>}
 */
export async function createUserIndexes() {
  try {
    const usersCollection = await getUsersCollection();

    console.log('Creating user collection indexes...');

    // Unique index on email for fast lookups and duplicate prevention
    await usersCollection.createIndex(
      { email: 1 },
      {
        unique: true,
        name: 'email_unique_idx',
        background: true
      }
    );

    // Index on createdAt for sorting and filtering by registration date
    await usersCollection.createIndex(
      { createdAt: -1 },
      {
        name: 'created_at_idx',
        background: true
      }
    );

    // Index on role for role-based queries
    await usersCollection.createIndex(
      { role: 1 },
      {
        name: 'role_idx',
        background: true
      }
    );

    // Index on isActive for filtering active users
    await usersCollection.createIndex(
      { isActive: 1 },
      {
        name: 'is_active_idx',
        background: true
      }
    );

    // Compound index for active users by role
    await usersCollection.createIndex(
      { isActive: 1, role: 1 },
      {
        name: 'active_role_idx',
        background: true
      }
    );

    // Index on lastLoginAt for analytics
    await usersCollection.createIndex(
      { lastLoginAt: -1 },
      {
        name: 'last_login_idx',
        background: true,
        sparse: true // Only index documents that have this field
      }
    );

    // Text index on bio for search functionality
    await usersCollection.createIndex(
      { bio: 'text', name: 'text' },
      {
        name: 'bio_text_search_idx',
        background: true,
        sparse: true // Only index documents that have these fields
      }
    );

    console.log('User collection indexes created successfully');

  } catch (error) {
    console.error('Failed to create user indexes:', error);
    throw new Error(`Index creation failed: ${error.message}`);
  }
}



/**
 * Creates the invitations collection and its indexes
 * @returns {Promise<void>}
 */
export async function createInvitationsCollection() {
  try {
    const db = await connectToDatabase();

    // Check if collection exists
    const collections = await db.listCollections({ name: 'invitations' }).toArray();

    if (collections.length === 0) {
      console.log('Creating invitations collection...');
      await db.createCollection('invitations');
      console.log('Invitations collection created successfully');
    }

    // Create indexes
    await createInvitationIndexes();

  } catch (error) {
    console.error('Failed to create invitations collection:', error);
    throw new Error(`Invitations initialization failed: ${error.message}`);
  }
}

/**
 * Creates indexes for the invitations collection
 * @returns {Promise<void>}
 */
export async function createInvitationIndexes() {
  try {
    const invitationsCollection = await getInvitationsCollection();
    console.log('Creating invitation collection indexes...');

    for (const index of INVITATION_INDEXES) {
      await invitationsCollection.createIndex(index.key, index.options || {});
    }

    console.log('Invitation collection indexes created successfully');
  } catch (error) {
    console.error('Failed to create invitation indexes:', error);
    throw new Error(`Invitation index creation failed: ${error.message}`);
  }
}

/**
 * Creates the team members collection and its indexes
 * @returns {Promise<void>}
 */
export async function createTeamMembersCollection() {
  try {
    const db = await connectToDatabase();

    // Check if collection exists
    const collections = await db.listCollections({ name: 'team_members' }).toArray();

    if (collections.length === 0) {
      console.log('Creating team_members collection...');
      await db.createCollection('team_members');
      console.log('Team members collection created successfully');
    }

    // Create indexes
    await createTeamMemberIndexes();

  } catch (error) {
    console.error('Failed to create team_members collection:', error);
    throw new Error(`Team members initialization failed: ${error.message}`);
  }
}

/**
 * Creates indexes for the team members collection
 * @returns {Promise<void>}
 */
export async function createTeamMemberIndexes() {
  try {
    const teamMembersCollection = await getTeamMembersCollection();
    console.log('Creating team member collection indexes...');

    for (const index of TEAM_MEMBER_INDEXES) {
      await teamMembersCollection.createIndex(index.key, index.options || {});
    }

    console.log('Team member collection indexes created successfully');
  } catch (error) {
    console.error('Failed to create team member indexes:', error);
    throw new Error(`Team member index creation failed: ${error.message}`);
  }
}

/**
 * Validates user document structure before insertion
 * @param {Object} userData - User data to validate
 * @returns {Object} Validated and normalized user data
 */
export function validateUserDocument(userData) {
  const now = new Date();

  // Required fields validation
  if (!userData.email || typeof userData.email !== 'string') {
    throw new Error('Email is required and must be a string');
  }

  if (!userData.password && userData.provider !== 'google') {
    throw new Error('Password is required for non-OAuth users');
  }

  // Email format validation
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(userData.email)) {
    throw new Error('Invalid email format');
  }

  // Normalize and set defaults
  const normalizedUser = {
    email: userData.email.toLowerCase().trim(),
    password: userData.password,
    name: userData.name || null,
    bio: userData.bio || null,
    photoURL: userData.photoURL || null,
    role: userData.role || 'user',
    createdAt: userData.createdAt || now,
    updatedAt: userData.updatedAt || now,
    isActive: userData.isActive !== undefined ? userData.isActive : true,
    emailVerified: userData.emailVerified || false
  };

  // Validate role
  const validRoles = ['user', 'admin', 'recruiter', 'manager'];
  if (!validRoles.includes(normalizedUser.role)) {
    throw new Error(`Invalid role. Must be one of: ${validRoles.join(', ')}`);
  }

  // Validate bio if provided
  if (normalizedUser.bio !== null) {
    if (typeof normalizedUser.bio !== 'string') {
      throw new Error('Bio must be a string');
    }

    const bioWordCount = normalizedUser.bio.trim().split(/\s+/).length;
    if (bioWordCount < 300 || bioWordCount > 500) {
      throw new Error('Bio must be between 300 and 500 words');
    }
  }

  // Validate photoURL if provided
  if (normalizedUser.photoURL !== null) {
    if (typeof normalizedUser.photoURL !== 'string') {
      throw new Error('Photo URL must be a string');
    }

    const urlRegex = /^https?:\/\/.*\.(jpg|jpeg|png|gif|webp)$/i;
    if (!urlRegex.test(normalizedUser.photoURL)) {
      throw new Error('Photo URL must be a valid image URL (jpg, jpeg, png, gif, webp)');
    }
  }

  return normalizedUser;
}

/**
 * Initializes the entire database with all collections and indexes
 * @returns {Promise<void>}
 */
export async function initializeDatabase() {
  try {
    console.log('Initializing Nexus ATS database...');

    // Create users collection and indexes
    await createUsersCollection();

    // Initialize Team Invitation and Member collections
    await createInvitationsCollection();
    await createTeamMembersCollection();

    // Add other collection initialization here as needed
    // await createJobsCollection();
    // await createCandidatesCollection();

    console.log('Database initialization completed successfully');

  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
}

/**
 * Drops all indexes and recreates them (useful for development)
 * @returns {Promise<void>}
 */
export async function recreateIndexes() {
  try {
    const usersCollection = await getUsersCollection();

    console.log('Dropping existing indexes...');
    await usersCollection.dropIndexes();

    console.log('Recreating indexes...');
    await createUserIndexes();

    console.log('Indexes recreated successfully');

  } catch (error) {
    console.error('Failed to recreate indexes:', error);
    throw error;
  }
}