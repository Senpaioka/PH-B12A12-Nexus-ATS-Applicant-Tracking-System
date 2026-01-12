/**
 * Job Collection Database Indexes
 * Sets up optimized indexes for job queries and operations
 */

import { getCollection } from '../mongodb.js';

/**
 * Creates all necessary indexes for the jobs collection
 * @returns {Promise<void>}
 */
export async function createJobIndexes() {
  try {
    const jobsCollection = await getCollection('jobs');

    console.log('Creating database indexes for jobs collection...');

    // 1. Index for user-specific job queries (most common query pattern)
    await jobsCollection.createIndex(
      { createdBy: 1, createdAt: -1 },
      { 
        name: 'user_jobs_by_date',
        background: true 
      }
    );

    // 2. Index for job status queries (for filtering active/inactive jobs)
    await jobsCollection.createIndex(
      { status: 1, createdAt: -1 },
      { 
        name: 'jobs_by_status_date',
        background: true 
      }
    );

    // 3. Compound index for user + status queries
    await jobsCollection.createIndex(
      { createdBy: 1, status: 1, createdAt: -1 },
      { 
        name: 'user_status_jobs',
        background: true 
      }
    );

    // 4. Index for department-based filtering
    await jobsCollection.createIndex(
      { department: 1, status: 1, createdAt: -1 },
      { 
        name: 'department_jobs',
        background: true 
      }
    );

    // 5. Index for employment type filtering
    await jobsCollection.createIndex(
      { type: 1, status: 1, createdAt: -1 },
      { 
        name: 'type_jobs',
        background: true 
      }
    );

    // 6. Text search index for job title and description search
    await jobsCollection.createIndex(
      { 
        title: 'text', 
        description: 'text', 
        requirements: 'text',
        location: 'text'
      },
      { 
        name: 'job_text_search',
        background: true,
        weights: {
          title: 10,        // Title is most important
          location: 5,      // Location is important
          description: 2,   // Description has medium weight
          requirements: 1   // Requirements have lowest weight
        }
      }
    );

    // 7. Index for location-based queries
    await jobsCollection.createIndex(
      { location: 1, status: 1, createdAt: -1 },
      { 
        name: 'location_jobs',
        background: true 
      }
    );

    // 8. Index for application count sorting (for popular jobs)
    await jobsCollection.createIndex(
      { applicationCount: -1, status: 1 },
      { 
        name: 'popular_jobs',
        background: true 
      }
    );

    console.log('Successfully created all job collection indexes');

  } catch (error) {
    console.error('Failed to create job indexes:', error);
    throw new Error(`Database index creation failed: ${error.message}`);
  }
}

/**
 * Lists all indexes on the jobs collection
 * @returns {Promise<Array>} Array of index information
 */
export async function listJobIndexes() {
  try {
    const jobsCollection = await getCollection('jobs');
    const indexes = await jobsCollection.listIndexes().toArray();
    
    console.log('Current indexes on jobs collection:');
    indexes.forEach(index => {
      console.log(`- ${index.name}: ${JSON.stringify(index.key)}`);
    });

    return indexes;

  } catch (error) {
    console.error('Failed to list job indexes:', error);
    throw new Error(`Failed to list indexes: ${error.message}`);
  }
}

/**
 * Drops all custom indexes (keeps only the default _id index)
 * @returns {Promise<void>}
 */
export async function dropJobIndexes() {
  try {
    const jobsCollection = await getCollection('jobs');
    
    console.log('Dropping custom indexes on jobs collection...');
    
    // Get all indexes except the default _id index
    const indexes = await jobsCollection.listIndexes().toArray();
    const customIndexes = indexes.filter(index => index.name !== '_id_');

    for (const index of customIndexes) {
      await jobsCollection.dropIndex(index.name);
      console.log(`Dropped index: ${index.name}`);
    }

    console.log('Successfully dropped all custom job indexes');

  } catch (error) {
    console.error('Failed to drop job indexes:', error);
    throw new Error(`Failed to drop indexes: ${error.message}`);
  }
}

/**
 * Ensures all job indexes exist (safe to run multiple times)
 * @returns {Promise<void>}
 */
export async function ensureJobIndexes() {
  try {
    await createJobIndexes();
    console.log('Job indexes are up to date');
  } catch (error) {
    // If indexes already exist, MongoDB will ignore the creation
    if (error.message.includes('already exists')) {
      console.log('Job indexes already exist');
      return;
    }
    throw error;
  }
}