# Email Verification Setup Guide

This guide explains how to configure email functionality for the Nexus ATS application.

## Development Mode (Default)

In development mode, the application automatically handles email configuration:

### Option 1: Console Logging (Simplest)
- **No configuration needed**
- Emails are logged to the console instead of being sent
- Perfect for testing the registration flow
- Look for `📧 EMAIL WOULD BE SENT` messages in the console

### Option 2: Ethereal Email (Fake SMTP)
- Automatically creates test accounts
- Provides preview URLs for sent emails
- No real emails are sent, but you can see the email content
- Look for `📧 Preview URL` in the console logs

## Production Mode

For production, you need to configure real SMTP settings in your `.env` file:

### Gmail Configuration
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@yourcompany.com
```

**Important for Gmail:**
- Use an "App Password", not your regular Gmail password
- Enable 2-factor authentication first
- Generate App Password: Google Account → Security → App passwords

### Other Email Providers

#### Outlook/Hotmail
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
```

#### Custom SMTP Server
```env
SMTP_HOST=mail.yourcompany.com
SMTP_PORT=587
SMTP_USER=noreply@yourcompany.com
SMTP_PASS=your-smtp-password
```

## Environment Variables

Add these to your `.env` file:

```env
# Email Configuration (Optional for development)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@nexusats.com
```

## Testing Email Functionality

### 1. Registration Test
1. Go to `/register`
2. Create a new account
3. Check console logs for email output
4. In production, check your email inbox

### 2. Verification Test
1. Go to `/verify-email`
2. Enter your email address
3. Click "Send Verification Email"
4. Check console logs or email inbox

### 3. Manual Cleanup
Run this command to clean up expired verification tokens:
```bash
npm run cleanup-tokens
```

## Troubleshooting

### Common Issues

#### "Failed to send email" Error
- **Development**: This is normal - emails are logged to console
- **Production**: Check your SMTP credentials and network connectivity

#### Gmail "Authentication Failed"
- Use App Password instead of regular password
- Enable 2-factor authentication
- Check that "Less secure app access" is disabled (use App Password instead)

#### Emails Not Received
- Check spam/junk folder
- Verify SMTP_FROM address is valid
- Test with a different email provider

### Debug Mode
Set `NODE_ENV=development` to see detailed email logs:
```bash
NODE_ENV=development npm run dev
```

## Email Templates

The application includes professional email templates for:
- **Email Verification**: Welcome email with verification link
- **Password Reset**: Secure password reset instructions

Templates are responsive and include:
- Company branding
- Clear call-to-action buttons
- Security information
- Professional styling

## Security Features

- **Token Expiration**: Verification tokens expire after 24 hours
- **Rate Limiting**: Prevents spam by limiting resend requests
- **Secure Tokens**: 64-character cryptographically secure tokens
- **Automatic Cleanup**: Expired tokens are automatically removed

## Production Checklist

Before deploying to production:

- [ ] Configure SMTP environment variables
- [ ] Test email sending with real email addresses
- [ ] Set up proper DNS records for your domain
- [ ] Configure SPF/DKIM records to prevent spam filtering
- [ ] Test the complete registration → verification → login flow
- [ ] Set up monitoring for email delivery failures

## Support

If you encounter issues:
1. Check the console logs for detailed error messages
2. Verify your SMTP configuration
3. Test with a simple email service first (like Gmail)
4. Check your email provider's documentation for SMTP settings