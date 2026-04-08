// User Types
export type UserType = 'regular' | 'expert' | 'admin';
export type Expectation = 'team_up' | 'work_for_others';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  date: string;
}

export interface Rating {
  overall: number;
  membershipScore: number;
  teamScore: number;
  projectScore: number;
  trainingScore: number;
}

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  profilePicture?: string;
  bio: string;
  expectation: Expectation;
  trackRecords: Achievement[];
  expertiseDomains: string[];
  targetCustomers: string[];
  resourcesAssets: string[];
  userType: UserType;
  rating: Rating;
  profileCompleteness: number;
  membershipDate: string;
  teamsJoined: number;
  successfulProjects: number;
  offlineTrainings: number;
  isSaved?: boolean;
  blockedUsers?: string[]; // IDs of users this user has blocked
  isTerminated?: boolean;
}

// Team Types
export interface TeamMember {
  userId: string;
  role: string;
  isManagement: boolean;
  joinedAt: string;
  user?: UserProfile;
}

export interface TeamInvitation {
  id: string;
  teamId: string;
  teamName: string;
  invitedUserId: string;
  invitedBy: string;
  invitedByName: string;
  role: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  createdAt: string;
  expiresAt: string;
}

export interface Milestone {
  id: string;
  title: string;
  description: string;
  date: string;
  completed: boolean;
}

export interface ChatbotRoom {
  id: string;
  chatId: string;
  name: string;
  createdAt: string;
  createdBy: string;
}

export interface Team {
  id: string;
  name: string;
  description: string;
  members: TeamMember[];
  founderId: string;
  combinedExpertise: string[];
  combinedResources: string[];
  achievements: Achievement[];
  milestones: Milestone[];
  chatId: string;
  chatbotChatId: string; // legacy — first chatbot room
  chatbotRooms: ChatbotRoom[]; // multiple AI chat rooms
  createdAt: string;
  businessModel?: BusinessModelCanvas;
  isTerminated?: boolean;
}

// Business Model Canvas
export interface BusinessModelCanvas {
  keyPartners: string[];
  keyActivities: string[];
  keyResources: string[];
  valuePropositions: string[];
  customerRelationships: string[];
  channels: string[];
  customerSegments: string[];
  costStructure: string[];
  revenueStreams: string[];
}

// Business Canvas Version (AI-generated HTML)
export interface BusinessCanvasVersion {
  id: string;
  teamId: string;
  version: number;
  htmlContent: string;
  summary: string;
  generatedAt: string;
  generatedBy: string; // userId who triggered the generation
}

// Chat Types
export type MessageType = 'text' | 'image' | 'file' | 'system' | 'invitation';
export type SenderType = 'user' | 'bot';

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  senderType: SenderType;
  content: string;
  type: MessageType;
  timestamp: string;
  reactions?: Reaction[];
  attachments?: Attachment[];
}

export interface Reaction {
  userId: string;
  emoji: string;
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
}

export interface Chat {
  id: string;
  name: string;
  type: 'team' | 'bot' | 'dm';
  participants: string[];
  teamId?: string;
  lastMessage?: Message;
  unreadCount: number;
  updatedAt: string;
}

// News Feed Types
export interface NewsComment {
  id: string;
  postId: string;
  authorId: string;
  content: string;
  timestamp: string;
}

export interface NewsPost {
  id: string;
  authorId: string;
  author?: UserProfile;
  content: string;
  image?: string;
  likes: number;
  likedBy?: string[]; // track who liked
  comments: number;
  commentsList?: NewsComment[];
  timestamp: string;
  type: 'achievement' | 'milestone' | 'announcement' | 'general';
}

// Auth Types
export interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  token: string | null;
}

// Search Types
export interface SearchFilters {
  name?: string;
  expertise?: string[];
  targetCustomers?: string[];
  expectation?: Expectation[];
}
export interface Report {
  id: string;
  reporterId: string;
  reportedUserId: string;
  reason: string;
  timestamp: string;
  resolved?: boolean;
}
