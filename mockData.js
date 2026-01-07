export const jobs = [
  {
    id: '1',
    title: 'Senior Frontend Engineer',
    department: 'Engineering',
    location: 'Remote',
    type: 'Full-time',
    salaryRange: '$140k - $180k',
    status: 'Active',
    applicantsCount: 45,
    postedAt: '2024-02-15'
  },
  {
    id: '2',
    title: 'Product Designer',
    department: 'Design',
    location: 'New York, NY',
    type: 'Full-time',
    salaryRange: '$110k - $150k',
    status: 'Active',
    applicantsCount: 28,
    postedAt: '2024-02-18'
  },
  {
    id: '3',
    title: 'Backend Developer (Go)',
    department: 'Engineering',
    location: 'San Francisco, CA',
    type: 'Contract',
    salaryRange: '$80/hr',
    status: 'Draft',
    applicantsCount: 0,
    postedAt: '2024-02-20'
  },
  {
    id: '4',
    title: 'Marketing Manager',
    department: 'Marketing',
    location: 'London, UK',
    type: 'Full-time',
    salaryRange: '£60k - £80k',
    status: 'Closed',
    applicantsCount: 112,
    postedAt: '2024-01-10'
  }
];

export const candidates = [
  {
    id: '101',
    name: 'Sarah Chen',
    email: 'sarah.c@example.com',
    role: 'Senior Frontend Engineer',
    appliedDate: '2024-02-20',
    status: 'Screening',
    experience: '6 years',
    skills: ['React', 'TypeScript', 'Next.js', 'Tailwind'],
  },
  {
    id: '102',
    name: 'Michael Ross',
    email: 'm.ross@example.com',
    role: 'Product Designer',
    appliedDate: '2024-02-19',
    status: 'Applied',
    experience: '4 years',
    skills: ['Figma', 'UI/UX', 'Prototyping'],
  },
  {
    id: '103',
    name: 'David Kim',
    email: 'dkim@example.com',
    role: 'Senior Frontend Engineer',
    appliedDate: '2024-02-15',
    status: 'Interview',
    experience: '8 years',
    skills: ['Vue', 'React', 'Node.js'],
  },
  {
    id: '104',
    name: 'Emily Davis',
    email: 'emily.d@example.com',
    role: 'Senior Frontend Engineer',
    appliedDate: '2024-02-14',
    status: 'Offer',
    experience: '5 years',
    skills: ['React', 'GraphQL', 'AWS'],
  },
  {
    id: '105',
    name: 'James Wilson',
    email: 'j.wilson@example.com',
    role: 'Product Designer',
    appliedDate: '2024-02-18',
    status: 'Applied',
    experience: '3 years',
    skills: ['Sketch', 'Adobe XD'],
  },
  {
    id: '106',
    name: 'Priya Patel',
    email: 'ppatel@example.com',
    role: 'Senior Frontend Engineer',
    appliedDate: '2024-02-10',
    status: 'Hired',
    experience: '7 years',
    skills: ['React', 'Redux', 'Performance'],
  }
];

export const interviews = [
  {
    id: 'i1',
    candidateId: '103',
    candidateName: 'David Kim',
    jobTitle: 'Senior Frontend Engineer',
    date: '2024-02-22',
    time: '14:00',
    interviewers: ['Alex Johnson', 'Sam Smith'],
    type: 'Technical'
  },
  {
    id: 'i2',
    candidateId: '101',
    candidateName: 'Sarah Chen',
    jobTitle: 'Senior Frontend Engineer',
    date: '2024-02-23',
    time: '10:00',
    interviewers: ['Jane Doe'],
    type: 'Screening'
  },
  {
    id: 'i3',
    candidateId: '107',
    candidateName: 'Marcus Brown',
    jobTitle: 'Product Designer',
    date: '2024-02-23',
    time: '15:30',
    interviewers: ['Emily White', 'Tom Hall'],
    type: 'Cultural'
  }
];
