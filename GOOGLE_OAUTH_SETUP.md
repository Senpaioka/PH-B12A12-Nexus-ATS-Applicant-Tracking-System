# Google OAuth Setup Guide

This guide will help you set up Google OAuth authentication for the Nexus ATS application.

## Prerequisites

- A Google account
- Access to Google Cloud Console

## Step 1: Create a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top of the page
3. Click "New Project"
4. Enter a project name (e.g., "Nexus ATS")
5. Click "Create"

## Step 2: Enable Google+ API

1. In the Google Cloud Console, navigate to "APIs & Services" > "Library"
2. Search for "Google+ API"
3. Click on "Google+ API" and then click "Enable"

## Step 3: Configure OAuth Consent Screen

1. Go to "APIs & Services" > "OAuth consent screen"
2. Choose "External" user type (unless you have a Google Workspace account)
3. Click "Create"
4. Fill in the required information:
   - App name: "Nexus ATS"
   - User support email: Your email
   - Developer contact information: Your email
5. Click "Save and Continue"
6. Skip the "Scopes" section by clicking "Save and Continue"
7. Skip the "Test users" section by clicking "Save and Continue"
8. Review and click "Back to Dashboard"

## Step 4: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Choose "Web application" as the application type
4. Enter a name (e.g., "Nexus ATS Web Client")
5. Add authorized redirect URIs:
   - For development: `http://localhost:3000/api/auth/callback/google`
   - For production: `https://yourdomain.com/api/auth/callback/google`
6. Click "Create"
7. Copy the Client ID and Client Secret

## Step 5: Configure Environment Variables

1. Open your `.env` file
2. Add the following variables:
   ```
   GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your-client-secret-here
   ```
3. Replace the values with your actual Client ID and Client Secret

## Step 6: Test the Integration

1. Start your development server: `npm run dev`
2. Go to the registration page: `http://localhost:3000/register`
3. You should see a "Sign up with Google" button
4. Go to the login page: `http://localhost:3000/login`
5. You should see a "Sign in with Google" button

## How It Works

### Registration Flow
- When a user clicks "Sign up with Google" on the registration page:
  - If the Google account is already registered → Shows error and suggests login
  - If the Google account is new → Creates a new user account and logs them in

### Login Flow
- When a user clicks "Sign in with Google" on the login page:
  - If the Google account is registered → Logs them in
  - If the Google account is not registered → Shows error and suggests registration

## Security Notes

- Google emails are automatically verified (no email verification needed)
- Users created via Google OAuth don't have passwords (they can only log in via Google)
- The system prevents duplicate accounts by checking email addresses
- All Google OAuth users are created with `emailVerified: true`

## Troubleshooting

### "Error 400: redirect_uri_mismatch"
- Make sure your redirect URI in Google Cloud Console exactly matches your application URL
- For development: `http://localhost:3000/api/auth/callback/google`
- For production: `https://yourdomain.com/api/auth/callback/google`

### "This app isn't verified"
- This is normal for development and testing
- Click "Advanced" and then "Go to Nexus ATS (unsafe)" to continue
- For production, you'll need to verify your app with Google

### Google button not appearing
- Check that `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set in your `.env` file
- Check the browser console for any JavaScript errors
- Verify that the NextAuth configuration includes the Google provider

## Production Deployment

When deploying to production:

1. Update the authorized redirect URIs in Google Cloud Console
2. Update `NEXTAUTH_URL` in your environment variables
3. Consider verifying your app with Google to remove the "unverified app" warning
4. Ensure your domain is added to the authorized domains list in the OAuth consent screen