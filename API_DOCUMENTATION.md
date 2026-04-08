# BusinessMatch Pro - API Documentation

## Table of Contents
1. [Overview](#overview)
2. [Authentication](#authentication)
3. [User API](#user-api)
4. [Profile API](#profile-api)
5. [Team API](#team-api)
6. [Chat API](#chat-api)
7. [Chatbot API](#chatbot-api)
8. [Types](#types)

---

## Overview

### Base URL
```
https://api.businessmatch.com/v1
```

### Response Format
All responses are in JSON format:

```json
{
  "success": true,
  "data": {},
  "message": "Optional message"
}
```

### Error Format
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description"
  }
}
```

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Server Error

---

## Authentication

### Register
```http
POST /auth/register
```

**Request Body:**
```json
{
  "fullName": "string",
  "email": "string",
  "phone": "string (optional)",
  "password": "string",
  "expectation": "team_up | work_for_others"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "string",
      "fullName": "string",
      "email": "string",
      "userType": "regular"
    },
    "token": "string"
  }
}
```

### Login
```http
POST /auth/login
```

**Request Body:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": "UserProfile",
    "token": "string"
  }
}
```

### SSO Login
```http
POST /auth/sso
```

**Request Body:**
```json
{
  "provider": "google | linkedin | github",
  "token": "string"
}
```

### Logout
```http
POST /auth/logout
```

**Headers:**
```
Authorization: Bearer {token}
```

---

## User API

### Get Current User
```http
GET /users/me
```

**Headers:**
```
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": "UserProfile"
  }
}
```

### Get User by ID
```http
GET /users/:id
```

**Headers:**
```
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": "UserProfile"
  }
}
```

### Update User
```http
PUT /users/:id
```

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "fullName": "string",
  "phone": "string",
  "bio": "string",
  "expectation": "team_up | work_for_others",
  "profilePicture": "string (URL)",
  "expertiseDomains": ["string"],
  "targetCustomers": ["string"],
  "resourcesAssets": ["string"],
  "trackRecords": [
    {
      "title": "string",
      "description": "string",
      "date": "ISO date string"
    }
  ]
}
```

---

## Profile API

### Search Users
```http
GET /profiles/search
```

**Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| name | string | Search by name |
| expertise | string[] | Filter by expertise |
| targetCustomers | string[] | Filter by target customers |
| page | number | Page number |
| limit | number | Results per page |

**Response:**
```json
{
  "success": true,
  "data": {
    "users": ["UserProfile"],
    "total": number,
    "page": number,
    "totalPages": number
  }
}
```

### Save Profile
```http
POST /profiles/:id/save
```

**Headers:**
```
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "message": "Profile saved successfully"
}
```

### Unsave Profile
```http
DELETE /profiles/:id/save
```

**Headers:**
```
Authorization: Bearer {token}
```

### Send Chat Request
```http
POST /profiles/:id/chat-request
```

**Headers:**
```
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "chatId": "string"
  }
}
```

### Report User
```http
POST /profiles/:id/report
```

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "reason": "string"
}
```

---

## Team API

### Get All Teams
```http
GET /teams
```

**Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| userId | string | Filter by member |
| search | string | Search by name |

**Response:**
```json
{
  "success": true,
  "data": {
    "teams": ["Team"]
  }
}
```

### Get Team by ID
```http
GET /teams/:id
```

**Headers:**
```
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "team": "Team"
  }
}
```

### Create Team
```http
POST /teams
```

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "name": "string",
  "description": "string",
  "members": [
    {
      "userId": "string",
      "role": "string"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "team": "Team"
  }
}
```

### Update Team
```http
PUT /teams/:id
```

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "name": "string",
  "description": "string",
  "achievements": [
    {
      "title": "string",
      "description": "string",
      "date": "ISO date string"
    }
  ],
  "milestones": [
    {
      "title": "string",
      "description": "string",
      "date": "ISO date string",
      "completed": boolean
    }
  ]
}
```

### Add Team Member
```http
POST /teams/:id/members
```

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "userId": "string",
  "role": "string"
}
```

### Remove Team Member
```http
DELETE /teams/:id/members/:userId
```

**Headers:**
```
Authorization: Bearer {token}
```

### Update Business Model Canvas
```http
PUT /teams/:id/business-model
```

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "keyPartners": ["string"],
  "keyActivities": ["string"],
  "keyResources": ["string"],
  "valuePropositions": ["string"],
  "customerRelationships": ["string"],
  "channels": ["string"],
  "customerSegments": ["string"],
  "costStructure": ["string"],
  "revenueStreams": ["string"]
}
```

---

## Chat API

### Get User Chats
```http
GET /chats
```

**Headers:**
```
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "chats": ["Chat"]
  }
}
```

### Get Chat Messages
```http
GET /chats/:id/messages
```

**Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| before | string | Get messages before ID |
| limit | number | Number of messages |

**Response:**
```json
{
  "success": true,
  "data": {
    "messages": ["Message"]
  }
}
```

### Send Message
```http
POST /chats/:id/messages
```

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "content": "string",
  "type": "text | image | file",
  "attachments": [
    {
      "name": "string",
      "url": "string",
      "type": "string",
      "size": number
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Message"
  }
}
```

### Add Reaction
```http
POST /chats/:id/messages/:messageId/reactions
```

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "emoji": "string"
}
```

### Search Messages
```http
GET /chats/:id/search
```

**Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| q | string | Search query |

---

## Chatbot API

### Get Chatbot Session
```http
GET /chatbot/:teamId/session
```

**Headers:**
```
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "chatId": "string",
    "history": ["Message"]
  }
}
```

### Send Message to Chatbot
```http
POST /chatbot/:chatId/message
```

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "content": "string"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "userMessage": "Message",
    "botResponse": "Message"
  }
}
```

### Generate Business Canvas
```http
POST /chatbot/:teamId/generate-canvas
```

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "businessIdea": "string",
  "targetMarket": "string"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "canvas": {
      "keyPartners": ["string"],
      "keyActivities": ["string"],
      "keyResources": ["string"],
      "valuePropositions": ["string"],
      "customerRelationships": ["string"],
      "channels": ["string"],
      "customerSegments": ["string"],
      "costStructure": ["string"],
      "revenueStreams": ["string"]
    }
  }
}
```

### Get Recommendations
```http
POST /chatbot/:teamId/recommendations
```

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "type": "team_members | resources | strategy"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "recommendations": [
      {
        "type": "string",
        "description": "string",
        "priority": "high | medium | low"
      }
    ]
  }
}
```

---

## Types

### UserProfile
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
  membershipDate: string;
  teamsJoined: number;
  successfulProjects: number;
  offlineTrainings: number;
}
```

### Team
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
  createdAt: string;
  businessModel?: BusinessModelCanvas;
}
```

### Message
```typescript
interface Message {
  id: string;
  chatId: string;
  senderId: string;
  senderType: 'user' | 'bot';
  content: string;
  type: 'text' | 'image' | 'file' | 'system';
  timestamp: string;
  reactions?: Reaction[];
  attachments?: Attachment[];
}
```

### BusinessModelCanvas
```typescript
interface BusinessModelCanvas {
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
```

---

## WebSocket Events

### Connection
```javascript
const ws = new WebSocket('wss://api.businessmatch.com/ws');
ws.onopen = () => {
  ws.send(JSON.stringify({
    type: 'auth',
    token: 'your-jwt-token'
  }));
};
```

### Events

#### New Message
```javascript
{
  "type": "new_message",
  "data": {
    "chatId": "string",
    "message": "Message"
  }
}
```

#### Typing Indicator
```javascript
{
  "type": "typing",
  "data": {
    "chatId": "string",
    "userId": "string",
    "isTyping": boolean
  }
}
```

#### User Joined/Left
```javascript
{
  "type": "user_status",
  "data": {
    "chatId": "string",
    "userId": "string",
    "status": "joined | left"
  }
}
```

---

## Rate Limiting

| Endpoint | Limit |
|----------|-------|
| Authentication | 10 requests/minute |
| API General | 100 requests/minute |
| Chat Messages | 60 messages/minute |
| Chatbot | 30 messages/minute |

---

## SDK Examples

### JavaScript/TypeScript
```typescript
import { BusinessMatchAPI } from '@businessmatch/sdk';

const api = new BusinessMatchAPI({
  baseURL: 'https://api.businessmatch.com/v1',
  token: 'your-jwt-token'
});

// Search users
const users = await api.profiles.search({
  expertise: ['Software Development'],
  targetCustomers: ['B2B Enterprises']
});

// Create team
const team = await api.teams.create({
  name: 'My Startup',
  description: 'Building the future'
});

// Send message
await api.chats.sendMessage(chatId, {
  content: 'Hello team!'
});
```

### Python
```python
from businessmatch import Client

client = Client(token='your-jwt-token')

# Search users
users = client.profiles.search(
    expertise=['Software Development'],
    target_customers=['B2B Enterprises']
)

# Create team
team = client.teams.create(
    name='My Startup',
    description='Building the future'
)
```
