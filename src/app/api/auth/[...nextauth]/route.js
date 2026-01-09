/**
 * NextAuth.js Configuration
 * Handles authentication with credentials provider and MongoDB integration
 */

import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { getUsersCollection } from '@/lib/mongodb';
import { verifyPassword } from '@/lib/auth/password';
import { getEnvConfig } from '@/lib/env';

/**
 * NextAuth configuration options
 */
const authOptions = {
  // Configure authentication providers
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'Email and Password',
      credentials: {
        email: {
          label: 'Email',
          type: 'email',
          placeholder: 'your@email.com'
        },
        password: {
          label: 'Password',
          type: 'password'
        }
      },
      async authorize(credentials) {
        try {
          // Validate input
          if (!credentials?.email || !credentials?.password) {
            console.log('Missing credentials');
            return null;
          }

          const email = credentials.email.toLowerCase().trim();
          const password = credentials.password;

          // Get user from database
          const usersCollection = await getUsersCollection();
          const user = await usersCollection.findOne({ email });

          if (!user) {
            console.log('User not found:', email);
            return null;
          }

          // Check if user account is active
          if (!user.isActive) {
            console.log('User account is inactive:', email);
            return null;
          }

          // Verify password
          const isValidPassword = await verifyPassword(password, user.password);
          if (!isValidPassword) {
            console.log('Invalid password for user:', email);
            return null;
          }

          // Update last login timestamp
          await usersCollection.updateOne(
            { _id: user._id },
            { 
              $set: { 
                lastLoginAt: new Date(),
                updatedAt: new Date()
              }
            }
          );

          console.log('User authenticated successfully:', email);

          // Return user object (password will be excluded)
          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            bio: user.bio,
            photoURL: user.photoURL,
            role: user.role,
            emailVerified: user.emailVerified,
            createdAt: user.createdAt,
            lastLoginAt: new Date()
          };

        } catch (error) {
          console.error('Authentication error:', error);
          return null;
        }
      }
    })
  ],

  // Configure session strategy
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },

  // Configure JWT
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  // Configure pages
  pages: {
    signIn: '/login',
    signUp: '/register',
    error: '/login', // Redirect to login on error
  },

  // Configure callbacks
  callbacks: {
    async jwt({ token, user, account }) {
      // Initial sign in
      if (account && user) {
        token.id = user.id;
        token.role = user.role;
        token.bio = user.bio;
        token.photoURL = user.photoURL;
        token.emailVerified = user.emailVerified;
        token.createdAt = user.createdAt;
        token.lastLoginAt = user.lastLoginAt;
      }

      return token;
    },

    async session({ session, token }) {
      // Send properties to the client
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.bio = token.bio;
        session.user.photoURL = token.photoURL;
        session.user.emailVerified = token.emailVerified;
        session.user.createdAt = token.createdAt;
        session.user.lastLoginAt = token.lastLoginAt;
      }

      return session;
    },

    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      
      // Allows callback URLs on the same origin
      if (new URL(url).origin === baseUrl) return url;
      
      return baseUrl;
    }
  },

  // Configure events
  events: {
    async signIn({ user, account, profile, isNewUser }) {
      console.log(`User signed in: ${user.email}`);
    },
    
    async signOut({ session, token }) {
      console.log(`User signed out: ${session?.user?.email || token?.email}`);
    },
    
    async session({ session, token }) {
      // Session is active
    }
  },

  // Enable debug messages in development
  debug: process.env.NODE_ENV === 'development',

  // Configure secret
  secret: getEnvConfig().NEXTAUTH_SECRET,
};

// Create NextAuth handler
const handler = NextAuth(authOptions);

// Export handlers for different HTTP methods
export { handler as GET, handler as POST };

// Export auth options for use in other parts of the application
export { authOptions };