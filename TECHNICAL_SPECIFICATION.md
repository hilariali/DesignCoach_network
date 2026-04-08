# Business Matching App - Technical Specification

## Project Overview
A full-stack business matching platform with resource matching, team formation, and AI-powered coaching chatbot features.

## Tech Stack

### Frontend
- **Framework**: React 18+ with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS 3.4+
- **UI Components**: shadcn/ui (40+ pre-installed components)
- **State Management**: Zustand
- **Routing**: React Router v6
- **Icons**: Lucide React
- **Chat UI**: Custom components with real-time messaging interface

### Backend (Mock/Simulation)
- **API Simulation**: Mock service workers (MSW) for demo purposes
- **Authentication**: JWT token simulation
- **Data Storage**: LocalStorage + In-memory state for demo

## Architecture

### Project Structure
```
src/
├── components/          # Reusable UI components
│   ├── ui/             # shadcn/ui components
│   ├── chat/           # Chat-related components
│   ├── profile/        # Profile components
│   └── team/           # Team components
├── pages/              # Page components
│   ├── Login.tsx
│   ├── Register.tsx
│   ├── Profile.tsx
│   ├── EditProfile.tsx
│   ├── UserLookup.tsx
│   ├── TeamProfile.tsx
│   ├── TeamList.tsx
│   ├── ChatRoom.tsx
│   ├── ChatbotRoom.tsx
│   └── NewsFeed.tsx
├── hooks/              # Custom React hooks
│   ├── useAuth.ts
│   ├── useChat.ts
│   └── useProfile.ts
├── store/              # Zustand stores
│   ├── authStore.ts
│   ├── chatStore.ts
│   ├── profileStore.ts
│   └── teamStore.ts
├── types/              # TypeScript interfaces
├── lib/                # Utility functions
├── data/               # Mock data
└── App.tsx             # Main app component
```

## Core Features & Implementation

### 1. Authentication System
**Components:**
- Login page (email/phone + password, SSO options)
- Registration page
- Protected route wrapper

**State:**
- User session with JWT token
- User type (regular/expert)

### 2. User Profile System
**Components:**
- Profile view page (public/private)
- Profile edit page
- Profile card (for search results)

**Data Model:**
```typescript
interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  profilePicture?: string;
  bio: string;
  expectation: 'team_up' | 'work_for_others';
  trackRecords: Achievement[];
  expertiseDomains: string[];
  targetCustomers: string[];
  resourcesAssets: string[];
  userType: 'regular' | 'expert';
  rating: Rating;
  profileCompleteness: number;
  membershipDate: Date;
  teamsJoined: number;
  successfulProjects: number;
  offlineTrainings: number;
}
```

### 3. User Lookup/Search
**Components:**
- Search bar with filters
- Results list with profile cards
- Filter chips (name, expertise, target audience)

**Features:**
- Search by name (fuzzy match)
- Filter by expertise domains
- Filter by target customers
- Results pagination

### 4. Team Management
**Components:**
- Team profile page
- Team list page
- Team creation modal
- Member management

**Data Model:**
```typescript
interface Team {
  id: string;
  name: string;
  description: string;
  members: TeamMember[];
  combinedExpertise: string[];
  combinedResources: string[];
  achievements: Achievement[];
  milestones: Milestone[];
  chatId: string;
  chatbotChatId: string;
}
```

### 5. Chat System
**Components:**
- Chat room (team chat)
- Message list with date delimiters
- Message input with attachments
- Chat details sidebar

**Features:**
- Real-time messaging simulation
- Media attachments (images, files)
- Message reactions
- Voice/video call buttons (UI only)
- Search messages

### 6. AI Chatbot Coaching
**Components:**
- Chatbot chat room
- AI message bubbles with typing indicator
- Coaching session manager

**Features:**
- User recommendations based on profile
- Lean Business Model Canvas generation
- Design-thinking-oriented coaching
- Turn-based conversation (users and bot take turns)

**AI Capabilities:**
- Profile analysis for matching
- Business canvas generation
- Coaching questions and guidance

### 7. Rating System
**Multi-aspect automatic rating:**
- Membership time (longer = higher)
- Teams joined (more = higher)
- Successful projects (more = higher)
- Offline trainings attended (more = higher)

### 8. News Feed
**Components:**
- Feed list with posts
- Post creation (optional)
- Activity notifications

## Data Flow

### Authentication Flow
1. User logs in → Auth store updates → Protected routes accessible
2. JWT token stored in localStorage
3. User data fetched and stored in profile store

### Chat Flow
1. User opens chat → Chat store loads messages
2. Messages displayed with virtual scrolling
3. New messages appended to store and UI
4. AI responses simulated with typing delay

### Profile Flow
1. Profile data fetched from store/API
2. Edit profile updates store and persists
3. Profile completeness calculated automatically

## UI/UX Design

### Color Scheme
- Primary: Blue (#3B82F6)
- Secondary: Slate (#64748B)
- Success: Green (#22C55E)
- Warning: Amber (#F59E0B)
- Error: Red (#EF4444)
- Expert Badge: Purple (#8B5CF6)
- Background: Gray-50 to Gray-100

### Typography
- Font: Inter (system fallback)
- Headings: font-semibold to font-bold
- Body: font-normal
- Small text: text-sm

### Layout
- Mobile-first responsive design
- Sidebar navigation on desktop
- Bottom navigation on mobile
- Max-width container: 1280px

### Components Style
- Cards: rounded-lg, shadow-sm, border
- Buttons: rounded-md, with hover states
- Inputs: rounded-md, focus ring
- Avatars: rounded-full

## Mock Data

### Sample Users (10+)
- Mix of regular and expert users
- Various expertise domains
- Different completion levels

### Sample Teams (5+)
- Different team sizes
- Various project stages
- Mixed expertise combinations

### Sample Chats
- Pre-populated conversations
- AI coaching examples

## Security Considerations
- Input sanitization
- XSS prevention
- CSRF protection (simulated)
- Password hashing (simulated)

## Performance Optimizations
- Component lazy loading
- Image optimization
- Virtual scrolling for chat
- Debounced search

## Browser Support
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
