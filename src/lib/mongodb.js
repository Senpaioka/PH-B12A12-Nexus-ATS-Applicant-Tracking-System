/**
 * MongoDB Connection Manager
 * Handles MongoDB Atlas connections with connection pooling using native MongoDB driver
 */

import { MongoClient } from 'mongodb';
import { getEnvConfig } from './env.js';

let client = null;
let db = null;

/**
 * MongoDB connection options for optimal performance and reliability
 */
const connectionOptions = {
  maxPoolSize: 10, // Maximum number of connections in the pool
  minPoolSize: 2,  // Minimum number of connections in the pool
  maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
  serverSelectionTimeoutMS: 5000, // How long to try selecting a server
  socketTimeoutMS: 45000, // How long a send or receive on a socket can take
  retryWrites: true, // Enable retryable writes
  retryReads: true,  // Enable retryable reads
  connectTimeoutMS: 10000, // How long to wait for initial connection
};

/**
 * Connects to MongoDB Atlas and returns the database instance
 * Uses connection pooling for optimal performance
 * @returns {Promise<Db>} MongoDB database instance
 */
export async function connectToDatabase() {
  try {
    // Validate environment variables
    const config = getEnvConfig();
    
    // Return existing connection if available
    if (client && db) {
      // Test the connection to ensure it's still alive
      await client.db('admin').command({ ping: 1 });
      return db;
    }

    console.log('Establishing new MongoDB connection...');
    
    // Create new MongoDB client with connection pooling
    client = new MongoClient(config.MONGODB_URI, connectionOptions);
    
    // Connect to MongoDB
    await client.connect();
    
    // Test the connection
    await client.db('admin').command({ ping: 1 });
    
    // Get database instance
    db = client.db(config.DB_NAME);
    
    console.log('Successfully connected to MongoDB Atlas');
    
    // Set up connection event listeners
    client.on('error', (error) => {
      console.error('MongoDB connection error:', error);
    });
    
    client.on('close', () => {
      console.log('MongoDB connection closed');
      client = null;
      db = null;
    });

    return db;
    
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    
    // Clean up on connection failure
    if (client) {
      try {
        await client.close();
      } catch (closeError) {
        console.error('Error closing MongoDB client:', closeError);
      }
      client = null;
      db = null;
    }
    
    throw new Error(`Database connection failed: ${error.message}`);
  }
}

/**
 * Gets the users collection with proper error handling
 * @returns {Promise<Collection>} MongoDB users collection
 */
export async function getUsersCollection() {
  try {
    const database = await connectToDatabase();
    return database.collection('users');
  } catch (error) {
    console.error('Failed to get users collection:', error);
    throw new Error(`Failed to access users collection: ${error.message}`);
  }
}

/**
 * Gets any collection by name with proper error handling
 * @param {string} collectionName - Name of the collection
 * @returns {Promise<Collection>} MongoDB collection
 */
export async function getCollection(collectionName) {
  try {
    const database = await connectToDatabase();
    return database.collection(collectionName);
  } catch (error) {
    console.error(`Failed to get collection ${collectionName}:`, error);
    throw new Error(`Failed to access collection ${collectionName}: ${error.message}`);
  }
}

/**
 * Closes the MongoDB connection
 * Should be called when the application shuts down
 */
export async function closeConnection() {
  if (client) {
    try {
      await client.close();
      console.log('MongoDB connection closed successfully');
    } catch (error) {
      console.error('Error closing MongoDB connection:', error);
    } finally {
      client = null;
      db = null;
    }
  }
}

/**
 * Checks if the database connection is healthy
 * @returns {Promise<boolean>} True if connection is healthy
 */
export async function isConnectionHealthy() {
  try {
    if (!client || !db) {
      return false;
    }
    
    await client.db('admin').command({ ping: 1 });
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}

/**
 * Gets connection status information
 * @returns {Object} Connection status details
 */
export function getConnectionStatus() {
  return {
    isConnected: !!(client && db),
    hasClient: !!client,
    hasDatabase: !!db
  };
}