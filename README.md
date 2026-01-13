# Nexus ATS - Applicant Tracking System

A modern, full-featured Applicant Tracking System (ATS) built with Next.js, MongoDB, and NextAuth.js. Nexus ATS streamlines the hiring process with comprehensive candidate management, job posting, interview scheduling, and real-time analytics.

![Next.js](https://img.shields.io/badge/Next.js-16.1.1-black)
![React](https://img.shields.io/badge/React-19.2.3-blue)
![MongoDB](https://img.shields.io/badge/MongoDB-6.12.0-green)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.0-blue)

## 🚀 Features

### 📊 **Dashboard & Analytics**
- Real-time statistics and metrics
- Application trends visualization
- Recent activity feed
- Performance insights and KPIs

### 👥 **Candidate Management**
- Comprehensive candidate profiles
- Application pipeline tracking
- Skills and experience management
- Document and resume handling

### 💼 **Job Management**
- Job posting creation and management
- Department and role categorization
- Application tracking per position
- Job status and lifecycle management

### 📅 **Interview Scheduling**
- Integrated interview scheduling system
- Multiple interview types (screening, technical, cultural, final)
- Video/phone/in-person meeting support
- Interviewer coordination and notifications

### 🔐 **Authentication & Security**
- NextAuth.js integration
- Google OAuth support
- Email verification system
- Secure session management
- Role-based access control

### 📧 **Email Integration**
- SMTP email support
- Automated notifications
- Email verification workflows
- Interview confirmations

## 🏗️ Architecture

### **Frontend**
- **Next.js 16.1.1** - React framework with App Router
- **React 19.2.3** - UI library with latest features
- **TailwindCSS 4.0** - Utility-first CSS framework
- **Lucide React** - Modern icon library
- **Recharts** - Data visualization components

### **Backend**
- **Next.js API Routes** - Serverless API endpoints
- **MongoDB 6.12.0** - NoSQL database
- **NextAuth.js** - Authentication framework
- **Nodemailer** - Email service integration

### **Testing**
- **Jest** - JavaScript testing framework
- **Fast-check** - Property-based testing library
- **MongoDB Memory Server** - In-memory database for testing

## 📁 Project Structure

```
nexus-ats/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # Authentication pages
│   │   ├── (dashboard)/       # Main application pages
│   │   │   ├── candidates/    # Candidate management
│   │   │   ├── jobs/          # Job management
│   │   │   ├── schedule/      # Interview scheduling
│   │   │   └── settings/      # Application settings
│   │   ├── api/               # API routes
│   │   │   ├── auth/          # Authentication endpoints
│   │   │   ├── candidates/    # Candidate CRUD operations
│   │   │   ├── dashboard/     # Dashboard data endpoints
│   │   │   ├── interviews/    # Interview management
│   │   │   └── jobs/          # Job management endpoints
│   │   └── verify-email/      # Email verification
│   ├── components/            # Reusable UI components
│   │   └── ui/               # Base UI components
│   ├── lib/                   # Business logic and utilities
│   │   ├── applications/      # Application management
│   │   ├── auth/             # Authentication logic
│   │   ├── candidates/       # Candidate services
│   │   ├── email/            # Email services
│   │   ├── interviews/       # Interview services
│   │   ├── jobs/             # Job services
│   │   └── utils/            # Utility functions
│   └── scripts/              # Database and maintenance scripts
├── .kiro/                    # Kiro AI specifications
│   └── specs/               # Feature specifications
└── public/                  # Static assets
```

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 18+ 
- MongoDB Atlas account or local MongoDB instance
- SMTP email service (Gmail, SendGrid, etc.)
- Google Cloud Console project (for OAuth, optional)

### 1. Clone the Repository
```bash
git clone <repository-url>
cd nexus-ats
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
```bash
# Copy environment template
cp .env.example .env

# Edit .env with your configuration
nano .env
```

#### Required Environment Variables:
```env
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/?appName=NexusATS
DB_NAME=nexus_ats

# Authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-super-secret-key-change-this-in-production

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@nexusats.com

# Google OAuth (Optional)
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### 4. Database Setup
```bash
# Initialize database collections and indexes
npm run init-db

# Or manually run the initialization script
node src/scripts/init-db.js
```

### 5. Start Development Server
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to access the application.

## 🔧 Configuration

### MongoDB Setup
1. Create a MongoDB Atlas cluster
2. Create a database user with read/write permissions
3. Whitelist your IP address
4. Copy the connection string to `MONGODB_URI`

### Email Configuration
#### Gmail Setup:
1. Enable 2-factor authentication
2. Generate an App Password
3. Use the App Password in `SMTP_PASS`

#### Other SMTP Providers:
- **SendGrid**: Use API key as password
- **Mailgun**: Use domain and API key
- **AWS SES**: Configure with access keys

### Google OAuth Setup (Optional)
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
6. Copy Client ID and Secret to environment variables

## 🚀 Deployment

### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
```

### Docker
```bash
# Build image
docker build -t nexus-ats .

# Run container
docker run -p 3000:3000 --env-file .env nexus-ats
```

### Manual Deployment
```bash
# Build for production
npm run build

# Start production server
npm start
```

## 🧪 Testing

### Run All Tests
```bash
npm test
```

### Property-Based Testing
The project includes comprehensive property-based tests using Fast-check:
```bash
# Run specific test suites
npm test -- --testPathPattern=property.test.js
```

### Test Coverage
```bash
npm test -- --coverage
```

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/auth/signin` - User sign in
- `POST /api/auth/signup` - User registration
- `GET /api/auth/session` - Get current session
- `POST /api/auth/signout` - Sign out user

### Dashboard Endpoints
- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/dashboard/trends` - Get application trends
- `GET /api/dashboard/activity` - Get recent activity

### Candidate Endpoints
- `GET /api/candidates` - List candidates with filtering
- `POST /api/candidates` - Create new candidate
- `GET /api/candidates/[id]` - Get candidate details
- `PUT /api/candidates/[id]` - Update candidate
- `DELETE /api/candidates/[id]` - Delete candidate

### Job Endpoints
- `GET /api/jobs` - List job postings
- `POST /api/jobs` - Create new job posting
- `GET /api/jobs/[id]` - Get job details
- `PUT /api/jobs/[id]` - Update job posting
- `DELETE /api/jobs/[id]` - Delete job posting

### Interview Endpoints
- `GET /api/interviews` - List interviews
- `POST /api/interviews` - Schedule new interview
- `GET /api/interviews/[id]` - Get interview details
- `PUT /api/interviews/[id]` - Update interview
- `DELETE /api/interviews/[id]` - Cancel interview

## 🔍 Key Features Deep Dive

### Interview Scheduling System
- **Comprehensive Validation**: Date/time constraints, business hours validation
- **Multiple Meeting Types**: Video calls, phone interviews, in-person meetings
- **Property-Based Testing**: Ensures correctness across all input combinations
- **Real-time Updates**: Automatic synchronization across the system

### Dashboard Analytics
- **Real-time Statistics**: Live data from MongoDB aggregations
- **Trend Analysis**: 7-day application trends with visual charts
- **Activity Feed**: Recent system activities and updates
- **Performance Metrics**: Time-to-hire and other KPIs

### Candidate Pipeline
- **Stage Management**: Track candidates through hiring stages
- **Skills Tracking**: Comprehensive skill and experience management
- **Document Handling**: Resume and document attachment support
- **Communication History**: Track all interactions and communications

## 🛡️ Security Features

- **Authentication**: Secure session-based authentication with NextAuth.js
- **Authorization**: Role-based access control
- **Data Validation**: Comprehensive input validation and sanitization
- **CSRF Protection**: Built-in CSRF protection
- **SQL Injection Prevention**: MongoDB's natural protection against SQL injection
- **Environment Security**: Secure environment variable handling

## 🔧 Maintenance

### Database Cleanup
```bash
# Clean up expired tokens
npm run cleanup-tokens
```

### Monitoring
- Monitor MongoDB Atlas metrics
- Check application logs
- Monitor API response times
- Track user activity and engagement

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow ESLint configuration
- Write property-based tests for business logic
- Update documentation for new features
- Ensure all tests pass before submitting PR

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Check the documentation and FAQ
- Review the API documentation

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- MongoDB for the robust database solution
- NextAuth.js for authentication infrastructure
- TailwindCSS for the utility-first CSS framework
- The open-source community for various packages and tools

---

**Built with ❤️ using Next.js, MongoDB, and modern web technologies.**
