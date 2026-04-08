import type { UserProfile, Team, Chat, Message, NewsPost } from '@/types';

// Expertise domains
export const expertiseDomains = [
  'Software Development',
  'Product Management',
  'UI/UX Design',
  'Marketing',
  'Sales',
  'Finance',
  'Legal',
  'Operations',
  'Data Science',
  'AI/ML',
  'Blockchain',
  'Healthcare',
  'Education',
  'E-commerce',
  'SaaS',
  'Mobile Apps',
  'Cloud Computing',
  'Cybersecurity',
  'IoT',
  'Renewable Energy'
];

// Target customers
export const targetCustomers = [
  'B2B Enterprises',
  'B2C Consumers',
  'SMBs',
  'Startups',
  'Healthcare Providers',
  'Educational Institutions',
  'Government',
  'Non-profits',
  'Retail',
  'Manufacturing',
  'Financial Services',
  'Real Estate',
  'Transportation',
  'Agriculture',
  'Entertainment'
];

// Resources/Assets
export const resourcesAssets = [
  'Funding ($10K-$50K)',
  'Funding ($50K-$100K)',
  'Funding ($100K+)',
  'Office Space',
  'Technical Infrastructure',
  'Industry Connections',
  'Mentorship Network',
  'Patents/IP',
  'Existing Customer Base',
  'Marketing Channels',
  'Development Team',
  'Design Team',
  'Legal Support',
  'Accounting Services',
  'Cloud Credits'
];

// Mock Users
export const mockUsers: UserProfile[] = [
  {
    id: 'user_1',
    fullName: 'Sarah Chen',
    email: 'sarah.chen@example.com',
    phone: '+1-555-0101',
    profilePicture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah',
    bio: 'Experienced product manager with 8+ years in SaaS startups. Passionate about building products that solve real problems.',
    expectation: 'team_up',
    trackRecords: [
      { id: 'tr1', title: 'Led Product at TechStart', description: 'Grew user base from 0 to 100K', date: '2022-01-15' },
      { id: 'tr2', title: 'PM at GrowthCo', description: 'Increased revenue by 300%', date: '2020-06-20' }
    ],
    expertiseDomains: ['Product Management', 'SaaS', 'Growth Strategy'],
    targetCustomers: ['B2B Enterprises', 'SMBs'],
    resourcesAssets: ['Industry Connections', 'Mentorship Network', 'Technical Infrastructure'],
    userType: 'expert',
    rating: { overall: 4.8, membershipScore: 5, teamScore: 5, projectScore: 4.5, trainingScore: 5 },
    profileCompleteness: 95,
    membershipDate: '2023-01-15',
    teamsJoined: 3,
    successfulProjects: 8,
    offlineTrainings: 12
  },
  {
    id: 'user_2',
    fullName: 'Michael Rodriguez',
    email: 'michael.r@example.com',
    phone: '+1-555-0102',
    profilePicture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=michael',
    bio: 'Full-stack developer specializing in React, Node.js, and cloud architecture. Looking to join an early-stage startup.',
    expectation: 'work_for_others',
    trackRecords: [
      { id: 'tr3', title: 'Senior Dev at CodeBase', description: 'Built microservices architecture', date: '2023-03-10' },
      { id: 'tr4', title: 'Tech Lead at StartupX', description: 'Led team of 5 developers', date: '2021-08-15' }
    ],
    expertiseDomains: ['Software Development', 'Cloud Computing', 'AI/ML'],
    targetCustomers: ['Startups', 'B2B Enterprises'],
    resourcesAssets: ['Technical Infrastructure', 'Development Team'],
    userType: 'regular',
    rating: { overall: 4.2, membershipScore: 4, teamScore: 4, projectScore: 4.5, trainingScore: 4 },
    profileCompleteness: 88,
    membershipDate: '2023-06-20',
    teamsJoined: 2,
    successfulProjects: 5,
    offlineTrainings: 6
  },
  {
    id: 'user_3',
    fullName: 'Emily Watson',
    email: 'emily.w@example.com',
    phone: '+1-555-0103',
    profilePicture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=emily',
    bio: 'UX/UI designer with a background in psychology. I create intuitive, user-centered designs that drive engagement.',
    expectation: 'team_up',
    trackRecords: [
      { id: 'tr5', title: 'Design Lead at CreativeStudio', description: 'Redesigned flagship product', date: '2022-11-20' },
      { id: 'tr6', title: 'Freelance Designer', description: '50+ successful projects', date: '2021-05-01' }
    ],
    expertiseDomains: ['UI/UX Design', 'Product Management', 'Mobile Apps'],
    targetCustomers: ['B2C Consumers', 'Startups'],
    resourcesAssets: ['Design Team', 'Industry Connections'],
    userType: 'expert',
    rating: { overall: 4.6, membershipScore: 4.5, teamScore: 4.5, projectScore: 5, trainingScore: 4.5 },
    profileCompleteness: 92,
    membershipDate: '2023-03-10',
    teamsJoined: 4,
    successfulProjects: 12,
    offlineTrainings: 8
  },
  {
    id: 'user_4',
    fullName: 'David Kim',
    email: 'david.kim@example.com',
    phone: '+1-555-0104',
    profilePicture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=david',
    bio: 'Marketing strategist with expertise in growth hacking and brand building. Former CMO at two successful startups.',
    expectation: 'team_up',
    trackRecords: [
      { id: 'tr7', title: 'CMO at BrandRocket', description: 'Achieved 10M users in 2 years', date: '2022-09-15' },
      { id: 'tr8', title: 'Marketing Director at ScaleUp', description: 'Series B to C growth', date: '2021-02-28' }
    ],
    expertiseDomains: ['Marketing', 'Sales', 'Growth Strategy'],
    targetCustomers: ['B2C Consumers', 'SMBs'],
    resourcesAssets: ['Marketing Channels', 'Existing Customer Base', 'Funding ($50K-$100K)'],
    userType: 'expert',
    rating: { overall: 4.9, membershipScore: 5, teamScore: 5, projectScore: 5, trainingScore: 4.5 },
    profileCompleteness: 98,
    membershipDate: '2022-12-01',
    teamsJoined: 5,
    successfulProjects: 15,
    offlineTrainings: 20
  },
  {
    id: 'user_5',
    fullName: 'Lisa Thompson',
    email: 'lisa.t@example.com',
    phone: '+1-555-0105',
    profilePicture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=lisa',
    bio: 'Data scientist with PhD in Statistics. Specializing in predictive modeling and machine learning applications.',
    expectation: 'work_for_others',
    trackRecords: [
      { id: 'tr9', title: 'Data Scientist at AI Corp', description: 'Built recommendation engine', date: '2023-01-10' },
      { id: 'tr10', title: 'Researcher at DataLab', description: 'Published 5 papers', date: '2021-07-15' }
    ],
    expertiseDomains: ['Data Science', 'AI/ML', 'Software Development'],
    targetCustomers: ['B2B Enterprises', 'Startups'],
    resourcesAssets: ['Technical Infrastructure', 'Patents/IP'],
    userType: 'regular',
    rating: { overall: 4.3, membershipScore: 3.5, teamScore: 4, projectScore: 5, trainingScore: 4.5 },
    profileCompleteness: 85,
    membershipDate: '2023-08-15',
    teamsJoined: 1,
    successfulProjects: 3,
    offlineTrainings: 4
  },
  {
    id: 'user_6',
    fullName: 'James Wilson',
    email: 'james.w@example.com',
    phone: '+1-555-0106',
    profilePicture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=james',
    bio: 'Serial entrepreneur with 3 exits. Looking to mentor and invest in promising startups.',
    expectation: 'team_up',
    trackRecords: [
      { id: 'tr11', title: 'Founder at ExitCo', description: '$50M exit', date: '2022-05-20' },
      { id: 'tr12', title: 'Angel Investor', description: '15+ investments', date: '2021-01-01' }
    ],
    expertiseDomains: ['Finance', 'Operations', 'Legal'],
    targetCustomers: ['Startups', 'SMBs'],
    resourcesAssets: ['Funding ($100K+)', 'Mentorship Network', 'Legal Support', 'Industry Connections'],
    userType: 'expert',
    rating: { overall: 5.0, membershipScore: 5, teamScore: 5, projectScore: 5, trainingScore: 5 },
    profileCompleteness: 100,
    membershipDate: '2022-10-01',
    teamsJoined: 8,
    successfulProjects: 20,
    offlineTrainings: 25
  },
  {
    id: 'user_7',
    fullName: 'Anna Martinez',
    email: 'anna.m@example.com',
    phone: '+1-555-0107',
    profilePicture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=anna',
    bio: 'Blockchain developer and Web3 enthusiast. Building decentralized applications for the future.',
    expectation: 'team_up',
    trackRecords: [
      { id: 'tr13', title: 'Blockchain Dev at CryptoCo', description: 'Launched 3 DeFi protocols', date: '2023-02-15' },
      { id: 'tr14', title: 'Smart Contract Auditor', description: 'Audited 20+ contracts', date: '2022-08-01' }
    ],
    expertiseDomains: ['Blockchain', 'Software Development', 'Cybersecurity'],
    targetCustomers: ['Startups', 'B2B Enterprises'],
    resourcesAssets: ['Technical Infrastructure', 'Cloud Credits'],
    userType: 'regular',
    rating: { overall: 4.4, membershipScore: 4, teamScore: 4, projectScore: 5, trainingScore: 4 },
    profileCompleteness: 90,
    membershipDate: '2023-05-10',
    teamsJoined: 2,
    successfulProjects: 6,
    offlineTrainings: 7
  },
  {
    id: 'user_8',
    fullName: 'Robert Taylor',
    email: 'rob.t@example.com',
    phone: '+1-555-0108',
    profilePicture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=robert',
    bio: 'Operations expert with experience scaling teams from 10 to 500+. Passionate about building efficient processes.',
    expectation: 'work_for_others',
    trackRecords: [
      { id: 'tr15', title: 'COO at ScaleFast', description: 'Scaled ops team to 200+', date: '2022-12-01' },
      { id: 'tr16', title: 'VP Ops at GrowthInc', description: 'Reduced costs by 40%', date: '2021-04-15' }
    ],
    expertiseDomains: ['Operations', 'Finance', 'HR'],
    targetCustomers: ['B2B Enterprises', 'SMBs'],
    resourcesAssets: ['Accounting Services', 'Office Space'],
    userType: 'expert',
    rating: { overall: 4.7, membershipScore: 4.5, teamScore: 5, projectScore: 4.5, trainingScore: 5 },
    profileCompleteness: 93,
    membershipDate: '2023-02-20',
    teamsJoined: 4,
    successfulProjects: 10,
    offlineTrainings: 15
  },
  {
    id: 'user_9',
    fullName: 'Priya Sharma',
    email: 'priya.s@example.com',
    phone: '+1-555-0109',
    profilePicture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=priya',
    bio: 'Healthcare strategist and biotech consultant. Bridging the gap between clinical research and market adoption.',
    expectation: 'team_up',
    trackRecords: [
      { id: 'tr17', title: 'VP Strategy at MedInnovate', description: 'Guided 3 FDA approvals', date: '2022-07-10' },
      { id: 'tr18', title: 'Consultant at BioStart', description: 'Raised $5M seed for biotech startups', date: '2021-11-01' }
    ],
    expertiseDomains: ['Healthcare', 'Operations', 'Legal'],
    targetCustomers: ['Healthcare Providers', 'B2B Enterprises'],
    resourcesAssets: ['Industry Connections', 'Mentorship Network', 'Legal Support'],
    userType: 'expert',
    rating: { overall: 4.7, membershipScore: 5, teamScore: 4.5, projectScore: 4.5, trainingScore: 5 },
    profileCompleteness: 96,
    membershipDate: '2023-04-01',
    teamsJoined: 3,
    successfulProjects: 9,
    offlineTrainings: 11
  },
  {
    id: 'user_10',
    fullName: 'Tommy Nguyen',
    email: 'tommy.n@example.com',
    phone: '+1-555-0110',
    profilePicture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=tommy',
    bio: 'Recent CS grad exploring startup opportunities. Strong in Python, JavaScript, and eager to learn everything about building products.',
    expectation: 'work_for_others',
    trackRecords: [
      { id: 'tr19', title: 'Intern at TechCorp', description: 'Built internal dashboard used by 200 employees', date: '2023-06-15' }
    ],
    expertiseDomains: ['Software Development', 'Mobile Apps'],
    targetCustomers: ['Startups'],
    resourcesAssets: ['Cloud Credits'],
    userType: 'regular',
    rating: { overall: 3.5, membershipScore: 3, teamScore: 3, projectScore: 4, trainingScore: 4 },
    profileCompleteness: 65,
    membershipDate: '2024-01-05',
    teamsJoined: 0,
    successfulProjects: 0,
    offlineTrainings: 2
  },
  {
    id: 'user_11',
    fullName: 'Olivia Park',
    email: 'olivia.p@example.com',
    phone: '+1-555-0111',
    profilePicture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=olivia',
    bio: 'EdTech innovator with 10 years in curriculum design and learning science. Built two successful e-learning platforms.',
    expectation: 'team_up',
    trackRecords: [
      { id: 'tr20', title: 'Founder of LearnFast', description: 'Platform used by 500K students', date: '2022-04-01' },
      { id: 'tr21', title: 'VP Product at EduCloud', description: 'Launched adaptive learning engine', date: '2020-09-15' }
    ],
    expertiseDomains: ['Education', 'Product Management', 'AI/ML'],
    targetCustomers: ['Educational Institutions', 'B2C Consumers'],
    resourcesAssets: ['Existing Customer Base', 'Industry Connections', 'Patents/IP'],
    userType: 'expert',
    rating: { overall: 4.8, membershipScore: 5, teamScore: 5, projectScore: 4.5, trainingScore: 5 },
    profileCompleteness: 98,
    membershipDate: '2023-02-01',
    teamsJoined: 3,
    successfulProjects: 11,
    offlineTrainings: 14
  },
  {
    id: 'user_12',
    fullName: 'Carlos Rivera',
    email: 'carlos.r@example.com',
    phone: '+1-555-0112',
    profilePicture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=carlos',
    bio: 'Hardware engineer turned IoT entrepreneur. Building smart devices for agriculture and environmental monitoring.',
    expectation: 'team_up',
    trackRecords: [
      { id: 'tr22', title: 'CTO at SmartFarm', description: 'Deployed 10K IoT sensors across 200 farms', date: '2023-01-20' },
      { id: 'tr23', title: 'Engineer at Intel', description: '5 years in chip design', date: '2020-03-01' }
    ],
    expertiseDomains: ['IoT', 'Renewable Energy', 'Software Development'],
    targetCustomers: ['Agriculture', 'B2B Enterprises', 'Government'],
    resourcesAssets: ['Technical Infrastructure', 'Patents/IP', 'Funding ($50K-$100K)'],
    userType: 'expert',
    rating: { overall: 4.5, membershipScore: 4, teamScore: 5, projectScore: 4.5, trainingScore: 4.5 },
    profileCompleteness: 91,
    membershipDate: '2023-07-01',
    teamsJoined: 2,
    successfulProjects: 7,
    offlineTrainings: 9
  }
];

// Mock Teams
export const mockTeams: Team[] = [
  {
    id: 'team_1',
    name: 'EcoTech Innovators',
    description: 'Building sustainable technology solutions for a greener future.',
    members: [
      { userId: 'user_1', role: 'Product Lead', joinedAt: '2023-07-01', isManagement: false },
      { userId: 'user_2', role: 'Tech Lead', joinedAt: '2023-07-05', isManagement: false },
      { userId: 'user_3', role: 'Design Lead', joinedAt: '2023-07-10', isManagement: false }
    ],
    founderId: 'user_1',
    chatbotRooms: [],
    combinedExpertise: ['Product Management', 'Software Development', 'UI/UX Design', 'SaaS', 'Cloud Computing'],
    combinedResources: ['Technical Infrastructure', 'Industry Connections', 'Mentorship Network', 'Design Team'],
    achievements: [
      { id: 'a1', title: 'Won GreenTech Hackathon', description: 'First place among 50 teams', date: '2023-09-15' },
      { id: 'a2', title: 'Seed Funding Secured', description: '$250K from angel investors', date: '2023-10-20' }
    ],
    milestones: [
      { id: 'm1', title: 'MVP Launch', description: 'Launch minimum viable product', date: '2023-12-01', completed: true },
      { id: 'm2', title: 'First 1000 Users', description: 'Acquire first 1000 active users', date: '2024-03-01', completed: false },
      { id: 'm3', title: 'Series A', description: 'Raise Series A funding', date: '2024-06-01', completed: false }
    ],
    chatId: 'chat_1',
    chatbotChatId: 'chatbot_1',
    createdAt: '2023-07-01',
    businessModel: {
      keyPartners: ['Solar panel manufacturers', 'Government agencies', 'Utility companies'],
      keyActivities: ['Platform development', 'Partner onboarding', 'Customer acquisition'],
      keyResources: ['Development team', 'Cloud infrastructure', 'Industry expertise'],
      valuePropositions: ['Reduce energy costs by 30%', 'Easy installation process', 'Real-time monitoring'],
      customerRelationships: ['Self-service portal', '24/7 support', 'Community forum'],
      channels: ['Direct sales', 'Partner referrals', 'Online marketing'],
      customerSegments: ['Homeowners', 'Small businesses', 'Property managers'],
      costStructure: ['Development costs', 'Cloud hosting', 'Sales & marketing'],
      revenueStreams: ['Subscription fees', 'Installation services', 'Maintenance contracts']
    }
  },
  {
    id: 'team_2',
    name: 'HealthAI Labs',
    description: 'AI-powered healthcare diagnostics and patient care optimization.',
    members: [
      { userId: 'user_5', role: 'Data Science Lead', joinedAt: '2023-08-15', isManagement: false },
      { userId: 'user_4', role: 'Growth Advisor', joinedAt: '2023-08-20', isManagement: false },
      { userId: 'user_6', role: 'Investor & Mentor', joinedAt: '2023-09-01', isManagement: false }
    ],
    founderId: 'user_5',
    chatbotRooms: [],
    combinedExpertise: ['Data Science', 'AI/ML', 'Marketing', 'Finance', 'Healthcare'],
    combinedResources: ['Funding ($100K+)', 'Technical Infrastructure', 'Mentorship Network', 'Patents/IP'],
    achievements: [
      { id: 'a3', title: 'FDA Approval Process', description: 'Started FDA clearance journey', date: '2023-11-10' },
      { id: 'a4', title: 'Pilot with 3 Hospitals', description: 'Successful pilot programs', date: '2023-12-05' }
    ],
    milestones: [
      { id: 'm4', title: 'Clinical Trials', description: 'Complete clinical validation', date: '2024-02-01', completed: false },
      { id: 'm5', title: 'FDA Clearance', description: 'Obtain FDA 510(k) clearance', date: '2024-08-01', completed: false }
    ],
    chatId: 'chat_2',
    chatbotChatId: 'chatbot_2',
    createdAt: '2023-08-15'
  },
  {
    id: 'team_3',
    name: 'FinFlow Solutions',
    description: 'Next-generation fintech platform for SMB banking.',
    members: [
      { userId: 'user_7', role: 'Blockchain Lead', joinedAt: '2023-06-10', isManagement: false },
      { userId: 'user_8', role: 'Operations Lead', joinedAt: '2023-06-15', isManagement: false }
    ],
    founderId: 'user_7',
    chatbotRooms: [],
    combinedExpertise: ['Blockchain', 'Operations', 'Finance', 'Cybersecurity'],
    combinedResources: ['Cloud Credits', 'Accounting Services', 'Technical Infrastructure'],
    achievements: [
      { id: 'a5', title: 'Beta Launch', description: '100 beta users onboarded', date: '2023-10-01' }
    ],
    milestones: [
      { id: 'm6', title: 'Public Launch', description: 'Open platform to public', date: '2024-01-15', completed: true },
      { id: 'm7', title: '1000 Business Users', description: 'Onboard 1000 SMBs', date: '2024-04-01', completed: false }
    ],
    chatId: 'chat_3',
    chatbotChatId: 'chatbot_3',
    createdAt: '2023-06-10'
  },
  {
    id: 'team_4',
    name: 'EdTech Pioneers',
    description: 'Revolutionizing K-12 education with AI-driven adaptive learning and gamification.',
    members: [
      { userId: 'user_11', role: 'Product & Education Lead', joinedAt: '2023-09-01', isManagement: false },
      { userId: 'user_10', role: 'Junior Developer', joinedAt: '2023-09-15', isManagement: false },
      { userId: 'user_12', role: 'Hardware Integration', joinedAt: '2023-10-01', isManagement: false }
    ],
    founderId: 'user_11',
    chatbotRooms: [],
    combinedExpertise: ['Education', 'Product Management', 'AI/ML', 'Software Development', 'Mobile Apps', 'IoT'],
    combinedResources: ['Existing Customer Base', 'Industry Connections', 'Patents/IP', 'Cloud Credits', 'Technical Infrastructure'],
    achievements: [
      { id: 'a6', title: 'EdTech Incubator Accepted', description: 'Accepted into top 10 EdTech incubator program', date: '2023-11-15' }
    ],
    milestones: [
      { id: 'm8', title: 'Prototype Complete', description: 'Adaptive learning MVP with 3 subjects', date: '2024-01-15', completed: true },
      { id: 'm9', title: 'School Pilot', description: 'Pilot with 5 schools and 500 students', date: '2024-04-01', completed: false },
      { id: 'm10', title: 'Seed Round', description: 'Raise $500K seed funding', date: '2024-06-01', completed: false }
    ],
    chatId: 'chat_4',
    chatbotChatId: 'chatbot_4',
    createdAt: '2023-09-01',
    businessModel: {
      keyPartners: ['School districts', 'Content publishers', 'Teacher training institutes'],
      keyActivities: ['Adaptive algorithm R&D', 'Content creation', 'School onboarding'],
      keyResources: ['AI/ML team', 'Education content library', 'Student data platform'],
      valuePropositions: ['Personalized learning paths', '3x faster learning outcomes', 'Teacher analytics dashboard'],
      customerRelationships: ['School account managers', 'Parent portal', 'Teacher community'],
      channels: ['Direct school sales', 'EdTech conferences', 'Teacher referrals'],
      customerSegments: ['K-12 schools', 'Tutoring centers', 'Homeschool families'],
      costStructure: ['AI infrastructure', 'Content development', 'Sales team'],
      revenueStreams: ['Per-student SaaS fee', 'School district licenses', 'Premium content packs']
    }
  }
];

// Mock Chats
export const mockChats: Chat[] = [
  {
    id: 'chat_1',
    name: 'EcoTech Innovators',
    type: 'team',
    participants: ['user_1', 'user_2', 'user_3'],
    teamId: 'team_1',
    unreadCount: 3,
    updatedAt: '2024-01-15T10:30:00Z'
  },
  {
    id: 'chat_2',
    name: 'HealthAI Labs',
    type: 'team',
    participants: ['user_5', 'user_4', 'user_6'],
    teamId: 'team_2',
    unreadCount: 0,
    updatedAt: '2024-01-14T16:45:00Z'
  },
  {
    id: 'chat_3',
    name: 'FinFlow Solutions',
    type: 'team',
    participants: ['user_7', 'user_8'],
    teamId: 'team_3',
    unreadCount: 1,
    updatedAt: '2024-01-15T09:00:00Z'
  },
  {
    id: 'chatbot_1',
    name: 'EcoTech AI Coach',
    type: 'bot',
    participants: ['user_1', 'user_2', 'user_3', 'bot'],
    teamId: 'team_1',
    unreadCount: 2,
    updatedAt: '2024-01-15T11:00:00Z'
  },
  {
    id: 'chatbot_2',
    name: 'HealthAI Coach',
    type: 'bot',
    participants: ['user_5', 'user_4', 'user_6', 'bot'],
    teamId: 'team_2',
    unreadCount: 0,
    updatedAt: '2024-01-14T14:00:00Z'
  },
  {
    id: 'chat_4',
    name: 'EdTech Pioneers',
    type: 'team',
    participants: ['user_11', 'user_10', 'user_12'],
    teamId: 'team_4',
    unreadCount: 2,
    updatedAt: '2024-01-16T08:00:00Z'
  },
  {
    id: 'chatbot_4',
    name: 'EdTech AI Coach',
    type: 'bot',
    participants: ['user_11', 'user_10', 'user_12', 'bot'],
    teamId: 'team_4',
    unreadCount: 1,
    updatedAt: '2024-01-16T09:00:00Z'
  }
];

// Mock Messages
export const mockMessages: Message[] = [
  // EcoTech Chat
  {
    id: 'msg_1',
    chatId: 'chat_1',
    senderId: 'user_1',
    senderType: 'user',
    content: 'Hey team! Great progress on the MVP. Let\'s discuss the launch strategy.',
    type: 'text',
    timestamp: '2024-01-15T09:00:00Z',
    reactions: [{ userId: 'user_2', emoji: '👍' }]
  },
  {
    id: 'msg_2',
    chatId: 'chat_1',
    senderId: 'user_2',
    senderType: 'user',
    content: 'Thanks Sarah! I\'ve prepared the deployment checklist. Should we schedule a review meeting?',
    type: 'text',
    timestamp: '2024-01-15T09:15:00Z'
  },
  {
    id: 'msg_3',
    chatId: 'chat_1',
    senderId: 'user_3',
    senderType: 'user',
    content: 'I\'m available tomorrow afternoon. Also, here are the final UI mockups!',
    type: 'text',
    timestamp: '2024-01-15T09:30:00Z',
    attachments: [{ id: 'att_1', name: 'ui-mockups-v2.fig', url: '#', type: 'figma', size: 15200000 }]
  },
  {
    id: 'msg_4',
    chatId: 'chat_1',
    senderId: 'user_1',
    senderType: 'user',
    content: 'Tomorrow 2pm works for me. Let\'s sync up!',
    type: 'text',
    timestamp: '2024-01-15T10:30:00Z'
  },
  // EcoTech Bot Chat
  {
    id: 'msg_bot_1',
    chatId: 'chatbot_1',
    senderId: 'bot',
    senderType: 'bot',
    content: 'Hello EcoTech team! I\'m your AI business coach. I can help you refine your business model, generate a lean canvas, or provide strategic recommendations. What would you like to work on today?',
    type: 'text',
    timestamp: '2024-01-15T10:00:00Z'
  },
  {
    id: 'msg_bot_2',
    chatId: 'chatbot_1',
    senderId: 'user_1',
    senderType: 'user',
    content: 'Can you help us refine our value proposition for the B2B segment?',
    type: 'text',
    timestamp: '2024-01-15T10:05:00Z'
  },
  {
    id: 'msg_bot_3',
    chatId: 'chatbot_1',
    senderId: 'bot',
    senderType: 'bot',
    content: 'Absolutely! Let\'s analyze your B2B value proposition. Based on your profile, you\'re targeting enterprises with sustainability goals.\n\nKey questions to refine:\n1. What specific pain points do enterprises face in energy management?\n2. How does your solution compare to existing alternatives?\n3. What quantifiable benefits can you demonstrate?\n\nWould you like me to generate a competitive analysis or help you craft messaging for different stakeholder personas?',
    type: 'text',
    timestamp: '2024-01-15T10:10:00Z'
  },
  {
    id: 'msg_bot_4',
    chatId: 'chatbot_1',
    senderId: 'user_2',
    senderType: 'user',
    content: 'Let\'s do the competitive analysis first.',
    type: 'text',
    timestamp: '2024-01-15T10:15:00Z'
  },
  {
    id: 'msg_bot_5',
    chatId: 'chatbot_1',
    senderId: 'bot',
    senderType: 'bot',
    content: 'Perfect! I\'ll analyze the competitive landscape for enterprise energy management solutions. Give me a moment...\n\n**Competitive Analysis: Enterprise Energy Management**\n\n| Competitor | Strengths | Weaknesses | Your Advantage |\n|------------|-----------|------------|----------------|\n| EcoStruxure | Brand recognition, comprehensive | Complex, expensive | Simplicity, cost |\n| EnergyCAP | Reporting features | Legacy UI, slow | Modern UX, real-time |\n| Lucid | Dashboard design | Limited integration | Open API, flexible |\n\n**Recommendation:** Focus on "fastest time to value" and "no-code integration" as your key differentiators.',
    type: 'text',
    timestamp: '2024-01-15T10:20:00Z'
  },
  // HealthAI Bot Chat — rich conversation for canvas generation testing
  {
    id: 'msg_health_1',
    chatId: 'chatbot_2',
    senderId: 'bot',
    senderType: 'bot',
    content: 'Welcome to HealthAI Labs! I\'m your AI Business Coach. I see you\'re building AI-powered healthcare diagnostics. How can I help you today?',
    type: 'text',
    timestamp: '2024-01-14T10:00:00Z'
  },
  {
    id: 'msg_health_2',
    chatId: 'chatbot_2',
    senderId: 'user_5',
    senderType: 'user',
    content: 'We want to focus on diagnostic imaging analysis. Our AI can detect early signs of lung cancer with 95% accuracy. How should we position this in the market?',
    type: 'text',
    timestamp: '2024-01-14T10:05:00Z'
  },
  {
    id: 'msg_health_3',
    chatId: 'chatbot_2',
    senderId: 'bot',
    senderType: 'bot',
    content: 'That\'s impressive accuracy. For market positioning, consider:\n\n1. **Primary target**: Community hospitals lacking specialist radiologists\n2. **Value prop**: "Second opinion in seconds" — augmenting, not replacing, doctors\n3. **Revenue model**: Per-scan SaaS fee ($5-15/scan) or site license\n4. **Regulatory path**: FDA 510(k) for computer-aided detection\n\nWho is your ideal first customer?',
    type: 'text',
    timestamp: '2024-01-14T10:10:00Z'
  },
  {
    id: 'msg_health_4',
    chatId: 'chatbot_2',
    senderId: 'user_4',
    senderType: 'user',
    content: 'We\'re thinking rural hospitals that don\'t have full-time radiologists. They send scans out and wait days for results. Our tool could give instant preliminary reads.',
    type: 'text',
    timestamp: '2024-01-14T10:15:00Z'
  },
  {
    id: 'msg_health_5',
    chatId: 'chatbot_2',
    senderId: 'bot',
    senderType: 'bot',
    content: 'Excellent positioning. Rural hospitals have acute pain points: long turnaround, doctor shortages, and patient anxiety. Your revenue model could be:\n\n- **Base**: $2,000/month/hospital (unlimited scans)\n- **Premium**: Real-time alerting + integration with PACS systems\n- **Key partners**: Radiology groups, hospital IT vendors, medical device distributors\n\nFor costs, your main expenses will be cloud GPU compute, HIPAA-compliant infrastructure, and regulatory compliance.',
    type: 'text',
    timestamp: '2024-01-14T10:20:00Z'
  },
  // HealthAI Team Chat
  {
    id: 'msg_hteam_1',
    chatId: 'chat_2',
    senderId: 'user_5',
    senderType: 'user',
    content: 'Team update: Our lung cancer detection model hit 95.3% accuracy on the validation set. Ready for clinical trials discussion.',
    type: 'text',
    timestamp: '2024-01-14T09:00:00Z'
  },
  {
    id: 'msg_hteam_2',
    chatId: 'chat_2',
    senderId: 'user_6',
    senderType: 'user',
    content: 'Great results Lisa! I\'ve connected us with Dr. Patel at Memorial Hospital. They\'re interested in being our first pilot site.',
    type: 'text',
    timestamp: '2024-01-14T09:30:00Z'
  },
  // EdTech Team Chat
  {
    id: 'msg_edteam_1',
    chatId: 'chat_4',
    senderId: 'user_11',
    senderType: 'user',
    content: 'Welcome to the team chat everyone! Our prototype covers math, reading, and science for grades 3-5. Let\'s plan the school pilot.',
    type: 'text',
    timestamp: '2024-01-16T08:00:00Z'
  },
  {
    id: 'msg_edteam_2',
    chatId: 'chat_4',
    senderId: 'user_10',
    senderType: 'user',
    content: 'Just finished the gamification module! Students earn badges and unlock new levels. The API is ready for testing.',
    type: 'text',
    timestamp: '2024-01-16T08:30:00Z'
  },
  {
    id: 'msg_edteam_3',
    chatId: 'chat_4',
    senderId: 'user_12',
    senderType: 'user',
    content: 'I\'m working on the hardware kit — a low-cost tablet + sensors bundle that schools can use for hands-on science experiments connected to the platform.',
    type: 'text',
    timestamp: '2024-01-16T09:00:00Z'
  },
  // EdTech Bot Chat
  {
    id: 'msg_edbot_1',
    chatId: 'chatbot_4',
    senderId: 'bot',
    senderType: 'bot',
    content: 'Hello EdTech Pioneers! I\'m your AI Business Coach. Your adaptive learning platform sounds like it has great potential. How can I help you today?',
    type: 'text',
    timestamp: '2024-01-16T09:00:00Z'
  },
  {
    id: 'msg_edbot_2',
    chatId: 'chatbot_4',
    senderId: 'user_11',
    senderType: 'user',
    content: 'We need help figuring out our pricing strategy. We\'re targeting K-12 schools with an adaptive learning platform that personalizes lessons using AI. We also have a hardware component for science labs.',
    type: 'text',
    timestamp: '2024-01-16T09:05:00Z'
  },
  {
    id: 'msg_edbot_3',
    chatId: 'chatbot_4',
    senderId: 'bot',
    senderType: 'bot',
    content: 'Great question! For K-12 EdTech, pricing is critical to adoption. Here are some approaches:\n\n1. **Per-student model**: $3-8/student/month — easy for schools to budget\n2. **District license**: Flat fee per school ($5K-15K/year) with unlimited students\n3. **Freemium**: Free basic access, premium content and analytics at a cost\n4. **Hardware bundle**: Software + sensor kit at $99/classroom\n\nThe key is aligning with how schools actually purchase software — usually through district budgets approved annually. What\'s your preferred model?',
    type: 'text',
    timestamp: '2024-01-16T09:10:00Z'
  }
];

// Mock News Feed
export const mockNewsFeed: NewsPost[] = [
  {
    id: 'post_1',
    authorId: 'user_1',
    content: 'Excited to announce that EcoTech Innovators just secured $250K in seed funding! This is a huge milestone for our team. Thanks to everyone who supported us on this journey. 🚀',
    likes: 45,
    comments: 12,
    timestamp: '2024-01-14T14:00:00Z',
    type: 'achievement'
  },
  {
    id: 'post_2',
    authorId: 'user_4',
    content: 'Just published a new article on growth strategies for B2B SaaS startups. Check it out and let me know your thoughts! #SaaS #Growth #Startup',
    likes: 28,
    comments: 8,
    timestamp: '2024-01-13T10:30:00Z',
    type: 'general'
  },
  {
    id: 'post_3',
    authorId: 'user_6',
    content: 'Looking for talented developers to join our portfolio companies. If you\'re passionate about fintech, AI, or healthtech, send me a message!',
    likes: 67,
    comments: 23,
    timestamp: '2024-01-12T16:00:00Z',
    type: 'announcement'
  },
  {
    id: 'post_4',
    authorId: 'user_3',
    content: 'HealthAI Labs just completed our pilot program with 3 major hospitals! The results exceeded our expectations. Onward to FDA clearance! 💪',
    likes: 52,
    comments: 15,
    timestamp: '2024-01-11T09:00:00Z',
    type: 'milestone'
  },
  {
    id: 'post_5',
    authorId: 'user_7',
    content: 'Blockchain is evolving rapidly. Excited to share insights from my latest DeFi project at the upcoming Web3 Summit. Who else is attending?',
    likes: 34,
    comments: 19,
    timestamp: '2024-01-10T11:00:00Z',
    type: 'general'
  }
];

// Current user (for demo)
export const currentUser: UserProfile = mockUsers[0];
