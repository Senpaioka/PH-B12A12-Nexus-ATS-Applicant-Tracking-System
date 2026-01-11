/**
 * NextAuth.js Configuration
 * Handles authentication with credentials provider and MongoDB integration
 */

import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
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
            return null;
          }

          const email = credentials.email.toLowerCase().trim();
          const password = credentials.password;

          // Get user from database
          const usersCollection = await getUsersCollection();
          const user = await usersCollection.findOne({ email });

          if (!user) {
            return null;
          }

          // Check if user account is active
          if (!user.isActive) {
            return null;
          }

          // Check if email is verified (optional - can be enforced or not)
          if (!user.emailVerified) {
            // For now, we'll allow login but include verification status
            // To enforce verification, uncomment the line below:
            // return null;
          }

          // Verify password
          const isValidPassword = await verifyPassword(password, user.password);
          if (!isValidPassword) {
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
          return null;
        }
      }
    }),

    // Conditionally add Google provider if credentials are available
    ...(getEnvConfig().GOOGLE_CLIENT_ID && getEnvConfig().GOOGLE_CLIENT_SECRET 
      ? [GoogleProvider({
          clientId: getEnvConfig().GOOGLE_CLIENT_ID,
          clientSecret: getEnvConfig().GOOGLE_CLIENT_SECRET,
        })]
      : []
    )
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
    async signIn({ user, account, profile, email, credentials }) {
      // Handle Google OAuth sign-in
      if (account?.provider === 'google') {
        try {
          const usersCollection = await getUsersCollection();
          const email = user.email.toLowerCase().trim();
          
          // Check if user exists in database
          const existingUser = await usersCollection.findOne({ email });
          
          // Get the current page from the callback URL to determine context
          const callbackUrl = account.callbackUrl || '';
          
          // Check for intent parameters to determine flow
          const isRegistrationFlow = callbackUrl.includes('intent=signup') || 
                                    callbackUrl.includes('/register') || 
                                    callbackUrl.includes('callbackUrl=%2Fregister') || 
                                    callbackUrl.includes('callbackUrl=/register');
          
          const isLoginFlow = callbackUrl.includes('intent=signin') || 
                            callbackUrl.includes('/login') || 
                            callbackUrl.includes('callbackUrl=%2Flogin') || 
                            callbackUrl.includes('callbackUrl=/login');
          
          // If no specific flow is detected, default to registration flow for new users
          if (!isRegistrationFlow && !isLoginFlow) {
            // Check if user exists - if not, treat as registration
            if (!existingUser) {
              // Treat as registration flow
              const now = new Date();
              const newUser = {
                email: email,
                password: null, // No password for Google users
                name: user.name || profile?.name || 'Google User',
                bio: null,
                photoURL: user.image || profile?.picture || null,
                role: 'user',
                provider: 'google',
                googleId: profile?.sub || user.id,
                createdAt: now,
                updatedAt: now,
                lastLoginAt: now,
                isActive: true,
                emailVerified: true, // Google emails are pre-verified
              };
              
              const result = await usersCollection.insertOne(newUser);
              
              // Update user object with database ID
              user.id = result.insertedId.toString();
              user.emailVerified = true;
              user.role = 'user';
              user.bio = null;
              user.photoURL = newUser.photoURL;
              user.createdAt = now;
              user.lastLoginAt = now;
              
              return true;
            } else {
              // User exists, treat as login
              await usersCollection.updateOne(
                { _id: existingUser._id },
                { 
                  $set: { 
                    lastLoginAt: new Date(),
                    updatedAt: new Date(),
                    // Update photo if changed
                    photoURL: user.image || profile?.picture || existingUser.photoURL
                  }
                }
              );
              
              // Update user object with database info
              user.id = existingUser._id.toString();
              user.emailVerified = existingUser.emailVerified;
              user.role = existingUser.role;
              user.bio = existingUser.bio;
              user.photoURL = user.image || profile?.picture || existingUser.photoURL;
              user.createdAt = existingUser.createdAt;
              user.lastLoginAt = new Date();
              
              return true;
            }
          }
          
          if (isRegistrationFlow) {
            // Registration page: Only allow if user doesn't exist
            if (existingUser) {
              // Use a custom error that NextAuth can handle
              const error = new Error('UserAlreadyExists');
              error.type = 'UserAlreadyExists';
              throw error;
            }
            
            // Create new user for Google registration
            const now = new Date();
            const newUser = {
              email: email,
              password: null, // No password for Google users
              name: user.name || profile?.name || 'Google User',
              bio: null,
              photoURL: user.image || profile?.picture || null,
              role: 'user',
              provider: 'google',
              googleId: profile?.sub || user.id,
              createdAt: now,
              updatedAt: now,
              lastLoginAt: now,
              isActive: true,
              emailVerified: true, // Google emails are pre-verified
            };
            
            const result = await usersCollection.insertOne(newUser);
            
            // Update user object with database ID
            user.id = result.insertedId.toString();
            user.emailVerified = true;
            user.role = 'user';
            user.bio = null;
            user.photoURL = newUser.photoURL;
            user.createdAt = now;
            user.lastLoginAt = now;
            
            return true;
          } else {
            // Login page or default: Only allow if user exists
            if (!existingUser) {
              // Always redirect unregistered users to registration page
              const error = new Error('UserNotRegistered');
              error.type = 'UserNotRegistered';
              throw error;
            }
            
            await usersCollection.updateOne(
              { _id: existingUser._id },
              { 
                $set: { 
                  lastLoginAt: new Date(),
                  updatedAt: new Date(),
                  // Update photo if changed
                  photoURL: user.image || profile?.picture || existingUser.photoURL
                }
              }
            );
            
            // Update user object with database info
            user.id = existingUser._id.toString();
            user.emailVerified = existingUser.emailVerified;
            user.role = existingUser.role;
            user.bio = existingUser.bio;
            user.photoURL = user.image || profile?.picture || existingUser.photoURL;
            user.createdAt = existingUser.createdAt;
            user.lastLoginAt = new Date();
            
            return true;
          }
        } catch (error) {
          return false;
        }
      }
      
      // Allow credentials provider (handled in authorize function)
      return true;
    },

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
        token.provider = account.provider;
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
        session.user.provider = token.provider;
      }

      return session;
    },

    async redirect({ url, baseUrl }) {
      
      // Handle error redirects
      if (url.includes('error=UserAlreadyExists')) {
        return `${baseUrl}/register?error=google-user-exists`;
      }
      if (url.includes('error=UserNotRegistered')) {
        return `${baseUrl}/register?error=google-not-registered`;
      }
      
      // Handle AccessDenied errors (fallback) - redirect to registration for unregistered users
      if (url.includes('error=AccessDenied')) {
        return `${baseUrl}/register?error=google-not-registered`;
      }
      
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
      // User signed in
    },
    
    async signOut({ session, token }) {
      // User signed out
    },
    
    async session({ session, token }) {
      // Session is active
    }
  },

  // Disable debug messages in production
  debug: false,

  // Configure secret
  secret: getEnvConfig().NEXTAUTH_SECRET,
};

// Create NextAuth handler
const handler = NextAuth(authOptions);

// Export handlers for different HTTP methods
export { handler as GET, handler as POST };

// Export auth options for use in other parts of the application
export { authOptions };