/**
 * Sample Data for Development and Demo
 * This file contains sample data for the ATS system
 */

// Sample candidates data
export const candidates = [
  {
    id: 1,
    name: "Sarah Johnson",
    role: "Frontend Developer",
    email: "sarah.johnson@email.com",
    phone: "+1 (555) 123-4567",
    experience: "3 years",
    skills: ["React", "TypeScript", "CSS", "JavaScript", "Next.js"],
    status: "Applied",
    appliedDate: "2024-01-15",
    resume: "/resumes/sarah-johnson.pdf",
    location: "San Francisco, CA"
  },
  {
    id: 2,
    name: "Michael Chen",
    role: "Backend Developer",
    email: "michael.chen@email.com",
    phone: "+1 (555) 234-5678",
    experience: "5 years",
    skills: ["Node.js", "Python", "MongoDB", "AWS", "Docker"],
    status: "Screening",
    appliedDate: "2024-01-12",
    resume: "/resumes/michael-chen.pdf",
    location: "New York, NY"
  },
  {
    id: 3,
    name: "Emily Rodriguez",
    role: "Full Stack Developer",
    email: "emily.rodriguez@email.com",
    phone: "+1 (555) 345-6789",
    experience: "4 years",
    skills: ["React", "Node.js", "PostgreSQL", "GraphQL", "TypeScript"],
    status: "Interview",
    appliedDate: "2024-01-10",
    resume: "/resumes/emily-rodriguez.pdf",
    location: "Austin, TX"
  },
  {
    id: 4,
    name: "David Kim",
    role: "DevOps Engineer",
    email: "david.kim@email.com",
    phone: "+1 (555) 456-7890",
    experience: "6 years",
    skills: ["Kubernetes", "AWS", "Terraform", "Jenkins", "Docker"],
    status: "Offer",
    appliedDate: "2024-01-08",
    resume: "/resumes/david-kim.pdf",
    location: "Seattle, WA"
  },
  {
    id: 5,
    name: "Lisa Thompson",
    role: "UI/UX Designer",
    email: "lisa.thompson@email.com",
    phone: "+1 (555) 567-8901",
    experience: "4 years",
    skills: ["Figma", "Adobe XD", "Sketch", "Prototyping", "User Research"],
    status: "Hired",
    appliedDate: "2024-01-05",
    resume: "/resumes/lisa-thompson.pdf",
    location: "Los Angeles, CA"
  }
];

// Sample jobs data
export const jobs = [
  {
    id: 1,
    title: "Senior Frontend Developer",
    department: "Engineering",
    location: "San Francisco, CA",
    type: "Full-time",
    salary: "$120,000 - $150,000",
    status: "Active",
    description: "We are looking for a Senior Frontend Developer to join our engineering team...",
    requirements: [
      "5+ years of experience with React",
      "Strong TypeScript skills",
      "Experience with modern build tools",
      "Knowledge of testing frameworks"
    ],
    postedDate: "2024-01-01",
    applications: 15,
    hiringManager: "John Smith"
  },
  {
    id: 2,
    title: "Backend Developer",
    department: "Engineering",
    location: "New York, NY",
    type: "Full-time",
    salary: "$100,000 - $130,000",
    status: "Active",
    description: "Join our backend team to build scalable APIs and services...",
    requirements: [
      "3+ years of Node.js experience",
      "Database design experience",
      "API development skills",
      "Cloud platform knowledge"
    ],
    postedDate: "2024-01-03",
    applications: 23,
    hiringManager: "Jane Doe"
  },
  {
    id: 3,
    title: "DevOps Engineer",
    department: "Infrastructure",
    location: "Remote",
    type: "Full-time",
    salary: "$110,000 - $140,000",
    status: "Active",
    description: "Help us scale our infrastructure and improve deployment processes...",
    requirements: [
      "Experience with Kubernetes",
      "AWS or similar cloud platform",
      "CI/CD pipeline experience",
      "Infrastructure as Code"
    ],
    postedDate: "2024-01-05",
    applications: 8,
    hiringManager: "Bob Wilson"
  },
  {
    id: 4,
    title: "Product Manager",
    department: "Product",
    location: "Austin, TX",
    type: "Full-time",
    salary: "$130,000 - $160,000",
    status: "Draft",
    description: "Lead product strategy and work with cross-functional teams...",
    requirements: [
      "5+ years of product management",
      "Technical background preferred",
      "Strong analytical skills",
      "Experience with agile methodologies"
    ],
    postedDate: "2024-01-07",
    applications: 0,
    hiringManager: "Alice Brown"
  }
];

// Sample interviews data
export const interviews = [
  {
    id: 1,
    candidateName: "Sarah Johnson",
    jobTitle: "Frontend Developer",
    date: "2024-01-20",
    time: "10:00 AM",
    duration: "1 hour",
    type: "Video Call",
    interviewer: "John Smith",
    interviewers: ["John Smith", "Alice Brown"], // Array of interviewers
    status: "Scheduled",
    meetingLink: "https://meet.google.com/abc-defg-hij"
  },
  {
    id: 2,
    candidateName: "Michael Chen",
    jobTitle: "Backend Developer",
    date: "2024-01-21",
    time: "2:00 PM",
    duration: "45 minutes",
    type: "Phone Call",
    interviewer: "Jane Doe",
    interviewers: ["Jane Doe"], // Array with single interviewer
    status: "Scheduled",
    meetingLink: null
  },
  {
    id: 3,
    candidateName: "Emily Rodriguez",
    jobTitle: "Full Stack Developer",
    date: "2024-01-22",
    time: "11:00 AM",
    duration: "1.5 hours",
    type: "In-person",
    interviewer: "Bob Wilson",
    interviewers: ["Bob Wilson", "Sarah Lee"], // Array of interviewers
    status: "Scheduled",
    meetingLink: null
  },
  {
    id: 4,
    candidateName: "David Kim",
    jobTitle: "DevOps Engineer",
    date: "2024-01-18",
    time: "3:00 PM",
    duration: "1 hour",
    type: "Video Call",
    interviewer: "Alice Brown",
    interviewers: ["Alice Brown"], // Array with single interviewer
    status: "Completed",
    meetingLink: "https://meet.google.com/xyz-uvwx-yz"
  }
];