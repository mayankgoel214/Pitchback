# HospitalityAI Training Simulator - Technical Specification
## CodeFest 2025

---

## Table of Contents
1. [Tech Stack](#tech-stack)
2. [System Architecture](#system-architecture)
3. [Database Schema](#database-schema)
4. [API Endpoints](#api-endpoints)
5. [Frontend Components](#frontend-components)
6. [Video & Audio Integration](#video--audio-integration)
7. [AI Integration](#ai-integration)
8. [Multi-Tenancy & Authentication](#multi-tenancy--authentication)
9. [User Roles & Permissions](#user-roles--permissions)
10. [Deployment Architecture](#deployment-architecture)
11. [Implementation Roadmap](#implementation-roadmap)

---

## Tech Stack

### Frontend
```json
{
  "framework": "Next.js 14+ (App Router)",
  "language": "TypeScript",
  "styling": "Tailwind CSS",
  "ui_components": "shadcn/ui",
  "state_management": "@tanstack/react-query",
  "forms": "react-hook-form + zod",
  "video": "react-webcam",
  "video_player": "react-player",
  "charts": "recharts"
}
```

### Backend
```json
{
  "runtime": "Node.js (via Next.js)",
  "api": "Next.js API Routes + Server Actions",
  "realtime": "WebSockets / Server-Sent Events"
}
```

### AI/ML Services
```json
{
  "speech_to_text": "OpenAI Whisper API",
  "conversational_ai": "OpenAI GPT-4 / GPT-4 Turbo",
  "text_to_speech": "ElevenLabs or OpenAI TTS",
  "evaluation_engine": "GPT-4 with custom prompts",
  "voice_activity_detection": "@ricky0123/vad-web",
  "future_video_ai": "Hume AI / AWS Rekognition"
}
```

### Database & Storage
```json
{
  "database": "PostgreSQL (via Supabase or Neon)",
  "orm": "Prisma or Drizzle ORM",
  "file_storage": "Supabase Storage or AWS S3",
  "cache": "Redis (optional for production)"
}
```

### Authentication
```json
{
  "auth_provider": "Supabase Auth or Clerk",
  "session_management": "JWT tokens",
  "future": "SSO for enterprise"
}
```

### Hosting & Infrastructure
```json
{
  "frontend": "Vercel",
  "database": "Supabase / Neon (managed Postgres)",
  "storage": "Supabase Storage / AWS S3",
  "cdn": "Cloudflare",
  "monitoring": "Vercel Analytics + Sentry"
}
```

### Development Tools
```json
{
  "package_manager": "pnpm or npm",
  "linting": "ESLint + Prettier",
  "testing": "Jest + React Testing Library",
  "e2e_testing": "Playwright (optional)"
}
```

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend (Next.js)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Trainee    │  │   Manager    │  │    Admin     │      │
│  │   Portal     │  │  Dashboard   │  │   Portal     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Layer (Next.js)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Scenarios   │  │   Sessions   │  │ Evaluations  │      │
│  │     API      │  │     API      │  │     API      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┼─────────────┐
                ▼             ▼             ▼
┌──────────────────┐  ┌──────────────┐  ┌──────────────┐
│    Database      │  │   AI APIs    │  │File Storage  │
│   (PostgreSQL)   │  │              │  │   (S3)       │
│                  │  │ - OpenAI     │  │              │
│ - Users          │  │ - Whisper    │  │ - Videos     │
│ - Organizations  │  │ - GPT-4      │  │ - Audio      │
│ - Scenarios      │  │ - TTS        │  │ - Avatars    │
│ - Sessions       │  │ - ElevenLabs │  │              │
│ - Evaluations    │  │              │  │              │
└──────────────────┘  └──────────────┘  └──────────────┘
```

### Request Flow - Training Session

```
1. Trainee starts session
   ↓
2. Frontend requests camera/mic permissions
   ↓
3. MediaRecorder initialized (client-side)
   ↓
4. Fetch scenario details from API
   ↓
5. Display scenario context + AI guest opening
   ↓
6. Real-time conversation loop:
   │
   ├─→ Voice Activity Detection (VAD) detects speech
   │   ↓
   ├─→ Audio chunk sent to Whisper API → transcript
   │   ↓
   ├─→ Transcript + conversation history → GPT-4 → AI response
   │   ↓
   ├─→ AI response → TTS API → audio file
   │   ↓
   ├─→ Play audio + display text
   │   ↓
   └─→ Repeat until session ends
   ↓
7. Stop recording → upload video to S3
   ↓
8. Full transcript + video metadata → GPT-4 evaluation
   ↓
9. Store evaluation results in database
   ↓
10. Display results page with scores + feedback
```

---

## Database Schema

### Core Tables

```sql
-- ============================================================
-- ORGANIZATIONS (Hotels)
-- ============================================================
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  logo_url TEXT,
  subscription_tier VARCHAR(50) DEFAULT 'free', -- free, pro, enterprise
  max_trainees INT DEFAULT 5,
  max_custom_scenarios INT DEFAULT 0,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL, -- trainee, manager, admin, super_admin
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  avatar_url TEXT,
  auth_provider_id TEXT, -- From Supabase Auth or Clerk
  onboarded BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_organization ON users(organization_id);
CREATE INDEX idx_users_email ON users(email);

-- ============================================================
-- SCENARIOS
-- ============================================================
CREATE TABLE scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL, -- angry_guests, emergencies, language_barriers, etc.
  difficulty VARCHAR(50) NOT NULL, -- beginner, intermediate, advanced
  context TEXT NOT NULL,
  ai_guest_opening TEXT NOT NULL,
  learning_objectives TEXT[] NOT NULL,
  success_criteria JSONB NOT NULL,

  -- Multi-tenancy
  is_global BOOLEAN DEFAULT FALSE, -- Platform-provided scenarios
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE, -- null if global
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,

  -- AI Configuration
  guest_persona JSONB NOT NULL, -- Personality, speaking style, emotion progression

  -- Session Settings
  estimated_duration INT DEFAULT 10, -- minutes
  max_turns INT DEFAULT 10,
  hints JSONB DEFAULT '[]', -- Array of hints for trainees

  -- Metadata
  tags TEXT[] DEFAULT '{}',
  thumbnail_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  usage_count INT DEFAULT 0,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_scenarios_organization ON scenarios(organization_id);
CREATE INDEX idx_scenarios_category ON scenarios(category);
CREATE INDEX idx_scenarios_difficulty ON scenarios(difficulty);
CREATE INDEX idx_scenarios_global ON scenarios(is_global);

-- ============================================================
-- TRAINING SESSIONS
-- ============================================================
CREATE TABLE training_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trainee_id UUID REFERENCES users(id) ON DELETE CASCADE,
  scenario_id UUID REFERENCES scenarios(id) ON DELETE CASCADE,

  -- Session Data
  video_url TEXT,
  audio_url TEXT,
  transcript JSONB, -- Array of {speaker, text, timestamp}
  conversation_history JSONB, -- Full conversation flow

  -- Evaluation Results
  evaluation JSONB, -- Detailed feedback
  scores JSONB NOT NULL DEFAULT '{}', -- {empathy: 0, clarity: 0, problem_solving: 0, professionalism: 0}
  overall_score INT,

  -- Session Metadata
  duration_seconds INT,
  turns_completed INT,
  hints_used INT DEFAULT 0,
  status VARCHAR(50) DEFAULT 'in_progress', -- in_progress, completed, abandoned

  -- Timestamps
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_sessions_trainee ON training_sessions(trainee_id);
CREATE INDEX idx_sessions_scenario ON training_sessions(scenario_id);
CREATE INDEX idx_sessions_status ON training_sessions(status);
CREATE INDEX idx_sessions_completed ON training_sessions(completed_at);

-- ============================================================
-- SCENARIO ASSIGNMENTS
-- ============================================================
CREATE TABLE scenario_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id UUID REFERENCES scenarios(id) ON DELETE CASCADE,
  trainee_id UUID REFERENCES users(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES users(id) ON DELETE SET NULL,
  due_date TIMESTAMP,
  completed BOOLEAN DEFAULT FALSE,
  assigned_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_assignments_trainee ON scenario_assignments(trainee_id);
CREATE INDEX idx_assignments_scenario ON scenario_assignments(scenario_id);

-- ============================================================
-- SCENARIO VERSIONS (for tracking changes)
-- ============================================================
CREATE TABLE scenario_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id UUID REFERENCES scenarios(id) ON DELETE CASCADE,
  version_number INT NOT NULL,
  changes JSONB NOT NULL,
  changed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_versions_scenario ON scenario_versions(scenario_id);

-- ============================================================
-- ANALYTICS / METRICS (optional, for caching)
-- ============================================================
CREATE TABLE organization_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  period VARCHAR(50) NOT NULL, -- daily, weekly, monthly
  period_start DATE NOT NULL,

  total_sessions INT DEFAULT 0,
  completed_sessions INT DEFAULT 0,
  average_score DECIMAL(5,2),
  average_duration_seconds INT,

  metrics JSONB, -- Detailed breakdown

  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(organization_id, period, period_start)
);

CREATE INDEX idx_metrics_org_period ON organization_metrics(organization_id, period, period_start);
```

### JSONB Field Structures

```typescript
// guest_persona JSONB structure
interface GuestPersona {
  personality_traits: string[];        // ['aggressive', 'impatient', 'demanding']
  speaking_style: string;              // 'short sentences', 'loud', 'repetitive'
  tone: string;                        // 'angry', 'frustrated', 'confused'
  emotion_progression: {
    start: string;                     // Initial emotional state
    good_response: string;             // How guest reacts to good handling
    bad_response: string;              // How guest reacts to poor handling
    end_goal: string;                  // Desired end state
  };
  difficulty_modifiers: {
    beginner: string;                  // Easier version
    intermediate: string;              // Standard version
    advanced: string;                  // Harder version
  };
  custom_instructions: string;         // Free-form AI system prompt additions
  voice_settings?: {
    voice_id: string;                  // ElevenLabs voice ID
    stability: number;                 // 0-1
    similarity_boost: number;          // 0-1
  };
}

// success_criteria JSONB structure
interface SuccessCriteria {
  empathy: {
    description: string;
    keywords: string[];                // Expected words/phrases
    min_score: number;                 // Minimum to pass
    examples: {
      good: string[];
      bad: string[];
    };
  };
  clarity: {
    description: string;
    requirements: string[];
    min_score: number;
    examples: {
      good: string[];
      bad: string[];
    };
  };
  problem_solving: {
    description: string;
    required_solutions: number;        // Min number of solutions to offer
    min_score: number;
    examples: {
      good: string[];
      bad: string[];
    };
  };
  professionalism: {
    description: string;
    avoid_phrases: string[];           // Phrases that hurt score
    required_behaviors: string[];
    min_score: number;
    examples: {
      good: string[];
      bad: string[];
    };
  };
}

// transcript JSONB structure
interface Transcript {
  exchanges: Array<{
    turn: number;
    speaker: 'trainee' | 'ai_guest';
    text: string;
    timestamp: string;                 // ISO 8601
    audio_url?: string;                // For AI guest responses
    duration_ms?: number;
  }>;
}

// evaluation JSONB structure
interface Evaluation {
  scores: {
    empathy: number;                   // 0-100
    clarity: number;                   // 0-100
    problem_solving: number;           // 0-100
    professionalism: number;           // 0-100
    overall: number;                   // Average
  };
  detailed_feedback: {
    empathy: {
      score: number;
      what_went_well: string[];
      areas_for_improvement: string[];
      specific_examples: string[];
    };
    clarity: {
      score: number;
      what_went_well: string[];
      areas_for_improvement: string[];
      specific_examples: string[];
    };
    problem_solving: {
      score: number;
      what_went_well: string[];
      areas_for_improvement: string[];
      specific_examples: string[];
    };
    professionalism: {
      score: number;
      what_went_well: string[];
      areas_for_improvement: string[];
      specific_examples: string[];
    };
  };
  overall_summary: string;
  best_practices: string[];
  key_mistakes: string[];
  improvement_recommendations: string[];
  standout_moments?: string[];
}
```

---

## API Endpoints

### Authentication

```typescript
POST   /api/auth/signup              // Register new user
POST   /api/auth/login               // Login
POST   /api/auth/logout              // Logout
GET    /api/auth/me                  // Get current user
PUT    /api/auth/me                  // Update profile
```

### Organizations

```typescript
GET    /api/organizations/:id        // Get organization details
PUT    /api/organizations/:id        // Update organization (admin only)
GET    /api/organizations/:id/users  // List users in organization
POST   /api/organizations/:id/invite // Invite user (manager+)
```

### Scenarios

```typescript
// Public scenarios (global templates)
GET    /api/scenarios/global                    // List all global scenarios
GET    /api/scenarios/global/:id                // Get global scenario details

// Organization scenarios
GET    /api/scenarios                           // List accessible scenarios (global + custom)
GET    /api/scenarios/:id                       // Get scenario details
POST   /api/scenarios                           // Create custom scenario (manager+)
PUT    /api/scenarios/:id                       // Update custom scenario (manager+)
DELETE /api/scenarios/:id                       // Delete custom scenario (manager+)
POST   /api/scenarios/:id/clone                 // Clone scenario (creates custom copy)

// Scenario management
GET    /api/scenarios/:id/analytics             // Get usage analytics (manager+)
POST   /api/scenarios/:id/test                  // Start test session (manager+)
PUT    /api/scenarios/:id/toggle-active         // Activate/deactivate scenario

// Assignments
POST   /api/scenarios/:id/assign                // Assign to trainees (manager+)
DELETE /api/scenarios/:id/assignments/:userId   // Remove assignment
GET    /api/users/:id/assigned-scenarios        // Get assigned scenarios for user
```

### Training Sessions

```typescript
// Session lifecycle
POST   /api/sessions                            // Create new session
GET    /api/sessions/:id                        // Get session details
PUT    /api/sessions/:id                        // Update session (for in-progress updates)
POST   /api/sessions/:id/complete               // Complete session

// Session interaction (real-time)
POST   /api/sessions/:id/message                // Send trainee message, get AI response
POST   /api/sessions/:id/audio                  // Upload audio chunk for transcription
GET    /api/sessions/:id/transcript             // Get current transcript

// Media upload
POST   /api/sessions/:id/upload-video           // Upload session recording
POST   /api/sessions/:id/upload-audio           // Upload audio recording

// Evaluation
POST   /api/sessions/:id/evaluate               // Trigger evaluation
GET    /api/sessions/:id/evaluation             // Get evaluation results

// User sessions
GET    /api/users/:id/sessions                  // List user's sessions
GET    /api/users/:id/sessions/stats            // Get user's statistics
```

### Analytics & Reporting

```typescript
// Trainee analytics
GET    /api/analytics/trainee/:id               // Individual trainee performance
GET    /api/analytics/trainee/:id/progress      // Progress over time

// Manager analytics
GET    /api/analytics/team                      // Team-wide analytics (manager+)
GET    /api/analytics/scenarios                 // Scenario usage analytics
GET    /api/analytics/scenarios/:id             // Specific scenario performance

// Organization analytics
GET    /api/analytics/organization              // Organization-wide metrics (admin+)
```

### AI Service Endpoints (Internal)

```typescript
// These are server-side only, not exposed to client
POST   /api/ai/transcribe                       // Whisper transcription
POST   /api/ai/conversation                     // GPT-4 conversation
POST   /api/ai/evaluate                         // GPT-4 evaluation
POST   /api/ai/text-to-speech                   // TTS generation
```

---

## Frontend Components

### Component Structure

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── signup/
│   ├── (trainee)/
│   │   ├── dashboard/
│   │   ├── scenarios/
│   │   │   ├── page.tsx                    // Scenario list
│   │   │   └── [id]/
│   │   │       ├── page.tsx                // Scenario details
│   │   │       └── practice/
│   │   │           └── page.tsx            // Training session
│   │   ├── sessions/
│   │   │   ├── page.tsx                    // Session history
│   │   │   └── [id]/
│   │   │       ├── page.tsx                // Session review
│   │   │       └── evaluation/
│   │   │           └── page.tsx            // Evaluation results
│   │   └── profile/
│   ├── (manager)/
│   │   ├── dashboard/
│   │   ├── scenarios/
│   │   │   ├── page.tsx                    // Scenario library
│   │   │   ├── new/
│   │   │   │   └── page.tsx                // Create scenario
│   │   │   └── [id]/
│   │   │       ├── edit/
│   │   │       │   └── page.tsx            // Edit scenario
│   │   │       └── analytics/
│   │   │           └── page.tsx            // Scenario analytics
│   │   ├── team/
│   │   │   ├── page.tsx                    // Team overview
│   │   │   └── [id]/
│   │   │       └── page.tsx                // Individual trainee view
│   │   └── analytics/
│   ├── (admin)/
│   │   └── ...
│   └── api/
│       ├── scenarios/
│       ├── sessions/
│       ├── analytics/
│       └── ai/
├── components/
│   ├── trainee/
│   │   ├── ScenarioCard.tsx
│   │   ├── ScenarioDetail.tsx
│   │   ├── TrainingSession/
│   │   │   ├── SessionContainer.tsx
│   │   │   ├── ScenarioHeader.tsx
│   │   │   ├── AIGuestZone.tsx
│   │   │   ├── TraineeVideo.tsx
│   │   │   ├── ControlBar.tsx
│   │   │   ├── ConversationHistory.tsx
│   │   │   └── VoiceActivityIndicator.tsx
│   │   ├── EvaluationResults/
│   │   │   ├── ScoreCard.tsx
│   │   │   ├── DetailedFeedback.tsx
│   │   │   └── VideoPlayback.tsx
│   │   └── ProgressDashboard.tsx
│   ├── manager/
│   │   ├── ScenarioBuilder/
│   │   │   ├── ScenarioForm.tsx
│   │   │   ├── BasicInfo.tsx
│   │   │   ├── ContextEditor.tsx
│   │   │   ├── AIPersonaConfig.tsx
│   │   │   ├── LearningObjectives.tsx
│   │   │   ├── SuccessCriteria.tsx
│   │   │   └── ScenarioPreview.tsx
│   │   ├── ScenarioLibrary.tsx
│   │   ├── TeamDashboard.tsx
│   │   ├── AnalyticsCharts.tsx
│   │   └── TraineePerformanceTable.tsx
│   ├── shared/
│   │   ├── ui/                             // shadcn/ui components
│   │   ├── layouts/
│   │   │   ├── AppLayout.tsx
│   │   │   ├── DashboardLayout.tsx
│   │   │   └── SessionLayout.tsx
│   │   ├── LoadingStates.tsx
│   │   └── ErrorBoundary.tsx
│   └── providers/
│       ├── AuthProvider.tsx
│       ├── QueryProvider.tsx
│       └── ThemeProvider.tsx
├── lib/
│   ├── api/
│   │   ├── scenarios.ts
│   │   ├── sessions.ts
│   │   └── analytics.ts
│   ├── hooks/
│   │   ├── useMediaRecorder.ts
│   │   ├── useVoiceActivityDetection.ts
│   │   ├── useScenarios.ts
│   │   ├── useSessions.ts
│   │   └── useAuth.ts
│   ├── utils/
│   │   ├── video.ts
│   │   ├── audio.ts
│   │   └── formatting.ts
│   └── types/
│       ├── scenario.ts
│       ├── session.ts
│       └── user.ts
└── config/
    ├── ai.ts
    └── constants.ts
```

### Key Component Details

#### TrainingSession Component

```typescript
// components/trainee/TrainingSession/SessionContainer.tsx

'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import ScenarioHeader from './ScenarioHeader';
import AIGuestZone from './AIGuestZone';
import TraineeVideo from './TraineeVideo';
import ControlBar from './ControlBar';
import ConversationHistory from './ConversationHistory';
import { useMediaRecorder } from '@/lib/hooks/useMediaRecorder';
import { useVoiceActivityDetection } from '@/lib/hooks/useVoiceActivityDetection';

export default function SessionContainer() {
  const { scenarioId } = useParams();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [scenario, setScenario] = useState(null);
  const [conversation, setConversation] = useState([]);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [turnCount, setTurnCount] = useState(0);
  const [sessionTime, setSessionTime] = useState(0);

  // Media recording
  const {
    stream,
    isRecording,
    startRecording,
    stopRecording,
    videoBlob
  } = useMediaRecorder();

  // Voice activity detection
  const {
    isListening,
    isSpeaking,
    transcript,
    startListening,
    stopListening
  } = useVoiceActivityDetection();

  // Initialize session
  useEffect(() => {
    initializeSession();
  }, [scenarioId]);

  const initializeSession = async () => {
    // Fetch scenario
    const scenarioData = await fetch(`/api/scenarios/${scenarioId}`).then(r => r.json());
    setScenario(scenarioData);

    // Create session
    const session = await fetch('/api/sessions', {
      method: 'POST',
      body: JSON.stringify({ scenario_id: scenarioId })
    }).then(r => r.json());
    setSessionId(session.id);

    // Start recording
    await startRecording();

    // Start listening
    await startListening();

    // Add AI's opening message
    setConversation([{
      speaker: 'ai_guest',
      text: scenarioData.ai_guest_opening,
      timestamp: new Date().toISOString()
    }]);

    // Play AI opening audio
    await playAIResponse(scenarioData.ai_guest_opening);
  };

  // Handle trainee speech
  useEffect(() => {
    if (transcript && !isAISpeaking) {
      handleTraineeMessage(transcript);
    }
  }, [transcript]);

  const handleTraineeMessage = async (message: string) => {
    // Add to conversation
    const traineeMessage = {
      speaker: 'trainee',
      text: message,
      timestamp: new Date().toISOString()
    };
    setConversation(prev => [...prev, traineeMessage]);

    // Send to API for AI response
    setIsAISpeaking(true);
    const response = await fetch(`/api/sessions/${sessionId}/message`, {
      method: 'POST',
      body: JSON.stringify({
        message,
        conversation_history: conversation
      })
    }).then(r => r.json());

    // Add AI response to conversation
    const aiMessage = {
      speaker: 'ai_guest',
      text: response.ai_response,
      timestamp: new Date().toISOString(),
      audio_url: response.audio_url
    };
    setConversation(prev => [...prev, aiMessage]);

    // Play AI response
    await playAIResponse(response.ai_response, response.audio_url);
    setIsAISpeaking(false);

    // Increment turn
    setTurnCount(prev => prev + 1);

    // Check if session should end
    if (turnCount >= scenario.max_turns) {
      endSession();
    }
  };

  const playAIResponse = async (text: string, audioUrl?: string) => {
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      await audio.play();
      await new Promise(resolve => {
        audio.onended = resolve;
      });
    } else {
      // Fallback: use browser TTS
      const utterance = new SpeechSynthesisUtterance(text);
      speechSynthesis.speak(utterance);
      await new Promise(resolve => {
        utterance.onend = resolve;
      });
    }
  };

  const endSession = async () => {
    // Stop listening and recording
    stopListening();
    const recording = await stopRecording();

    // Upload video
    const formData = new FormData();
    formData.append('video', videoBlob);
    await fetch(`/api/sessions/${sessionId}/upload-video`, {
      method: 'POST',
      body: formData
    });

    // Complete session
    await fetch(`/api/sessions/${sessionId}/complete`, {
      method: 'POST',
      body: JSON.stringify({
        transcript: conversation,
        duration_seconds: sessionTime,
        turns_completed: turnCount
      })
    });

    // Trigger evaluation (async)
    fetch(`/api/sessions/${sessionId}/evaluate`, { method: 'POST' });

    // Redirect to evaluation page
    window.location.href = `/sessions/${sessionId}/evaluation`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <ScenarioHeader
        scenario={scenario}
        turnCount={turnCount}
        maxTurns={scenario?.max_turns}
        sessionTime={sessionTime}
      />

      <div className="relative h-[calc(100vh-120px)]">
        <AIGuestZone
          scenario={scenario}
          currentMessage={conversation[conversation.length - 1]}
          isSpeaking={isAISpeaking}
        />

        <TraineeVideo
          stream={stream}
          isRecording={isRecording}
        />

        <ConversationHistory conversation={conversation} />
      </div>

      <ControlBar
        isListening={isListening}
        isSpeaking={isSpeaking}
        onEndSession={endSession}
        scenario={scenario}
      />
    </div>
  );
}
```

#### ScenarioBuilder Component

```typescript
// components/manager/ScenarioBuilder/ScenarioForm.tsx

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import BasicInfo from './BasicInfo';
import ContextEditor from './ContextEditor';
import AIPersonaConfig from './AIPersonaConfig';
import LearningObjectives from './LearningObjectives';
import SuccessCriteria from './SuccessCriteria';

const scenarioSchema = z.object({
  title: z.string().min(5).max(255),
  category: z.string(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  context: z.string().min(50),
  ai_guest_opening: z.string().min(10),
  learning_objectives: z.array(z.string()).min(3),
  success_criteria: z.object({
    empathy: z.object({
      description: z.string(),
      keywords: z.array(z.string()),
      min_score: z.number().min(0).max(100)
    }),
    clarity: z.object({
      description: z.string(),
      requirements: z.array(z.string()),
      min_score: z.number().min(0).max(100)
    }),
    problem_solving: z.object({
      description: z.string(),
      required_solutions: z.number().min(1),
      min_score: z.number().min(0).max(100)
    }),
    professionalism: z.object({
      description: z.string(),
      avoid_phrases: z.array(z.string()),
      min_score: z.number().min(0).max(100)
    })
  }),
  guest_persona: z.object({
    personality_traits: z.array(z.string()),
    speaking_style: z.string(),
    tone: z.string(),
    emotion_progression: z.object({
      start: z.string(),
      good_response: z.string(),
      bad_response: z.string(),
      end_goal: z.string()
    }),
    custom_instructions: z.string().optional()
  }),
  estimated_duration: z.number().min(5).max(30),
  max_turns: z.number().min(5).max(20)
});

type ScenarioFormData = z.infer<typeof scenarioSchema>;

export default function ScenarioForm({ initialData, onSubmit, onCancel }) {
  const [currentStep, setCurrentStep] = useState(1);

  const form = useForm<ScenarioFormData>({
    resolver: zodResolver(scenarioSchema),
    defaultValues: initialData || {
      difficulty: 'beginner',
      estimated_duration: 10,
      max_turns: 10,
      learning_objectives: [''],
      guest_persona: {
        personality_traits: [],
        emotion_progression: {
          start: '',
          good_response: '',
          bad_response: '',
          end_goal: ''
        }
      }
    }
  });

  const handleSubmit = async (data: ScenarioFormData) => {
    try {
      const response = await fetch('/api/scenarios', {
        method: initialData ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        const scenario = await response.json();
        onSubmit(scenario);
      }
    } catch (error) {
      console.error('Failed to save scenario:', error);
    }
  };

  const steps = [
    { id: 1, name: 'Basic Info', component: BasicInfo },
    { id: 2, name: 'Context', component: ContextEditor },
    { id: 3, name: 'AI Persona', component: AIPersonaConfig },
    { id: 4, name: 'Learning Objectives', component: LearningObjectives },
    { id: 5, name: 'Success Criteria', component: SuccessCriteria }
  ];

  const CurrentStepComponent = steps[currentStep - 1].component;

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
      {/* Step indicator */}
      <div className="flex justify-between mb-8">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={`flex items-center ${
              index < currentStep - 1 ? 'text-green-600' :
              index === currentStep - 1 ? 'text-blue-600' :
              'text-gray-400'
            }`}
          >
            <div className={`rounded-full h-10 w-10 flex items-center justify-center border-2 ${
              index < currentStep - 1 ? 'border-green-600 bg-green-600 text-white' :
              index === currentStep - 1 ? 'border-blue-600 bg-blue-600 text-white' :
              'border-gray-300'
            }`}>
              {index < currentStep - 1 ? '✓' : step.id}
            </div>
            <span className="ml-2 hidden md:block">{step.name}</span>
            {index < steps.length - 1 && (
              <div className="w-16 h-1 bg-gray-300 mx-4" />
            )}
          </div>
        ))}
      </div>

      {/* Current step content */}
      <CurrentStepComponent form={form} />

      {/* Navigation */}
      <div className="flex justify-between pt-8">
        <button
          type="button"
          onClick={() => currentStep > 1 ? setCurrentStep(currentStep - 1) : onCancel()}
          className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          {currentStep === 1 ? 'Cancel' : 'Previous'}
        </button>

        {currentStep < steps.length ? (
          <button
            type="button"
            onClick={() => setCurrentStep(currentStep + 1)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Next
          </button>
        ) : (
          <button
            type="submit"
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Save Scenario
          </button>
        )}
      </div>
    </form>
  );
}
```

---

## Video & Audio Integration

### Media Capture Setup

```typescript
// lib/hooks/useMediaRecorder.ts

import { useState, useRef, useCallback } from 'react';

interface UseMediaRecorderReturn {
  stream: MediaStream | null;
  isRecording: boolean;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<Blob>;
  pauseRecording: () => void;
  resumeRecording: () => void;
  videoBlob: Blob | null;
}

export function useMediaRecorder(): UseMediaRecorderReturn {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async () => {
    try {
      // Request camera and microphone permissions
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      });

      setStream(mediaStream);

      // Initialize MediaRecorder
      const mimeType = MediaRecorder.isTypeSupported('video/webm; codecs=vp9')
        ? 'video/webm; codecs=vp9'
        : 'video/webm';

      const mediaRecorder = new MediaRecorder(mediaStream, {
        mimeType,
        videoBitsPerSecond: 2500000 // 2.5 Mbps
      });

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      // Handle data available
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      // Start recording
      mediaRecorder.start(1000); // Capture data every second
      setIsRecording(true);

    } catch (error) {
      console.error('Error starting recording:', error);
      throw error;
    }
  }, []);

  const stopRecording = useCallback(async (): Promise<Blob> => {
    return new Promise((resolve) => {
      if (!mediaRecorderRef.current) return;

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        setVideoBlob(blob);
        setIsRecording(false);

        // Stop all tracks
        stream?.getTracks().forEach(track => track.stop());
        setStream(null);

        resolve(blob);
      };

      mediaRecorderRef.current.stop();
    });
  }, [stream]);

  const pauseRecording = useCallback(() => {
    mediaRecorderRef.current?.pause();
  }, []);

  const resumeRecording = useCallback(() => {
    mediaRecorderRef.current?.resume();
  }, []);

  return {
    stream,
    isRecording,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    videoBlob
  };
}
```

### Voice Activity Detection

```typescript
// lib/hooks/useVoiceActivityDetection.ts

import { useState, useEffect, useRef } from 'react';
import { useMicVAD } from '@ricky0123/vad-react';

interface UseVADReturn {
  isListening: boolean;
  isSpeaking: boolean;
  transcript: string | null;
  startListening: () => Promise<void>;
  stopListening: () => void;
}

export function useVoiceActivityDetection(): UseVADReturn {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState<string | null>(null);

  const audioChunksRef = useRef<Float32Array[]>([]);

  const vad = useMicVAD({
    startOnLoad: false,
    onSpeechStart: () => {
      setIsSpeaking(true);
      audioChunksRef.current = [];
    },
    onSpeechEnd: async (audio) => {
      setIsSpeaking(false);

      // Convert audio to WAV blob
      const wavBlob = audioDataToWav(audio);

      // Send to Whisper API
      const formData = new FormData();
      formData.append('audio', wavBlob);

      try {
        const response = await fetch('/api/ai/transcribe', {
          method: 'POST',
          body: formData
        });

        const data = await response.json();
        setTranscript(data.transcript);

        // Reset transcript after component consumes it
        setTimeout(() => setTranscript(null), 100);
      } catch (error) {
        console.error('Transcription error:', error);
      }
    },
    onVADMisfire: () => {
      setIsSpeaking(false);
    }
  });

  const startListening = async () => {
    await vad.start();
    setIsListening(true);
  };

  const stopListening = () => {
    vad.pause();
    setIsListening(false);
  };

  return {
    isListening,
    isSpeaking,
    transcript,
    startListening,
    stopListening
  };
}

// Helper function to convert Float32Array to WAV blob
function audioDataToWav(audioData: Float32Array): Blob {
  const sampleRate = 16000;
  const numChannels = 1;
  const bitsPerSample = 16;

  const buffer = new ArrayBuffer(44 + audioData.length * 2);
  const view = new DataView(buffer);

  // WAV header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + audioData.length * 2, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // fmt chunk size
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * bitsPerSample / 8, true);
  view.setUint16(32, numChannels * bitsPerSample / 8, true);
  view.setUint16(34, bitsPerSample, true);
  writeString(view, 36, 'data');
  view.setUint32(40, audioData.length * 2, true);

  // PCM samples
  let offset = 44;
  for (let i = 0; i < audioData.length; i++) {
    const sample = Math.max(-1, Math.min(1, audioData[i]));
    view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
    offset += 2;
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}
```

### Video Upload

```typescript
// lib/utils/video.ts

export async function uploadVideo(
  sessionId: string,
  videoBlob: Blob,
  onProgress?: (progress: number) => void
): Promise<string> {
  // Option 1: Direct upload to API
  const formData = new FormData();
  formData.append('video', videoBlob, `session-${sessionId}.webm`);

  const xhr = new XMLHttpRequest();

  return new Promise((resolve, reject) => {
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        const progress = (e.loaded / e.total) * 100;
        onProgress(progress);
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status === 200) {
        const response = JSON.parse(xhr.responseText);
        resolve(response.video_url);
      } else {
        reject(new Error('Upload failed'));
      }
    });

    xhr.addEventListener('error', () => reject(new Error('Upload failed')));

    xhr.open('POST', `/api/sessions/${sessionId}/upload-video`);
    xhr.send(formData);
  });
}

// Option 2: Chunked upload for large files
export async function uploadVideoChunked(
  sessionId: string,
  videoBlob: Blob,
  onProgress?: (progress: number) => void
): Promise<string> {
  const chunkSize = 5 * 1024 * 1024; // 5MB chunks
  const totalChunks = Math.ceil(videoBlob.size / chunkSize);

  for (let i = 0; i < totalChunks; i++) {
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, videoBlob.size);
    const chunk = videoBlob.slice(start, end);

    const formData = new FormData();
    formData.append('chunk', chunk);
    formData.append('chunkIndex', i.toString());
    formData.append('totalChunks', totalChunks.toString());

    await fetch(`/api/sessions/${sessionId}/upload-video-chunk`, {
      method: 'POST',
      body: formData
    });

    if (onProgress) {
      onProgress(((i + 1) / totalChunks) * 100);
    }
  }

  // Finalize upload
  const response = await fetch(`/api/sessions/${sessionId}/finalize-video`, {
    method: 'POST'
  });

  const data = await response.json();
  return data.video_url;
}

// Video compression (optional, for large files)
export async function compressVideo(videoBlob: Blob): Promise<Blob> {
  // Using @ffmpeg/ffmpeg for client-side compression
  const { FFmpeg } = await import('@ffmpeg/ffmpeg');
  const { fetchFile } = await import('@ffmpeg/util');

  const ffmpeg = new FFmpeg();
  await ffmpeg.load();

  await ffmpeg.writeFile('input.webm', await fetchFile(videoBlob));

  await ffmpeg.exec([
    '-i', 'input.webm',
    '-c:v', 'libx264',
    '-preset', 'fast',
    '-crf', '28',
    '-c:a', 'aac',
    '-b:a', '128k',
    'output.mp4'
  ]);

  const data = await ffmpeg.readFile('output.mp4');
  return new Blob([data], { type: 'video/mp4' });
}
```

---

## AI Integration

### OpenAI Configuration

```typescript
// lib/ai/openai.ts

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Transcription
export async function transcribeAudio(audioFile: File): Promise<string> {
  const transcription = await openai.audio.transcriptions.create({
    file: audioFile,
    model: 'whisper-1',
    language: 'en',
    response_format: 'text'
  });

  return transcription;
}

// AI Guest Conversation
export async function generateAIGuestResponse(
  scenario: any,
  conversationHistory: any[],
  traineeMessage: string
): Promise<string> {
  const systemPrompt = buildAIGuestSystemPrompt(scenario);

  const messages = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory.map(msg => ({
      role: msg.speaker === 'trainee' ? 'user' : 'assistant',
      content: msg.text
    })),
    { role: 'user', content: traineeMessage }
  ];

  const completion = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages,
    temperature: 0.8,
    max_tokens: 200
  });

  return completion.choices[0].message.content;
}

function buildAIGuestSystemPrompt(scenario: any): string {
  const persona = scenario.guest_persona;

  return `You are roleplaying as a hotel guest in a training simulation. Here is your character:

SCENARIO CONTEXT:
${scenario.context}

YOUR CHARACTER:
- Personality: ${persona.personality_traits.join(', ')}
- Speaking style: ${persona.speaking_style}
- Current emotional state: ${persona.tone}

BEHAVIOR INSTRUCTIONS:
- Start ${persona.emotion_progression.start}
- If the trainee responds well (shows empathy, offers solutions), gradually ${persona.emotion_progression.good_response}
- If the trainee responds poorly (is defensive, dismissive, unhelpful), ${persona.emotion_progression.bad_response}
- Your goal is to reach: ${persona.emotion_progression.end_goal}

${persona.custom_instructions || ''}

IMPORTANT:
- Stay in character throughout the conversation
- Respond naturally like a real guest would
- Keep responses under 3-4 sentences
- Don't break character or mention this is a simulation
- Adjust your tone based on how the trainee handles the situation`;
}

// Evaluation
export async function evaluateSession(
  scenario: any,
  transcript: any[]
): Promise<any> {
  const systemPrompt = buildEvaluationSystemPrompt(scenario);

  const conversationText = transcript
    .map(msg => `${msg.speaker === 'trainee' ? 'TRAINEE' : 'GUEST'}: ${msg.text}`)
    .join('\n');

  const completion = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Evaluate this training session:\n\n${conversationText}` }
    ],
    response_format: { type: 'json_object' },
    temperature: 0.3
  });

  return JSON.parse(completion.choices[0].message.content);
}

function buildEvaluationSystemPrompt(scenario: any): string {
  const criteria = scenario.success_criteria;

  return `You are an expert hospitality trainer evaluating a front desk training session.

SCENARIO: ${scenario.title}
LEARNING OBJECTIVES:
${scenario.learning_objectives.map((obj, i) => `${i + 1}. ${obj}`).join('\n')}

EVALUATION CRITERIA:

1. EMPATHY (0-100):
${criteria.empathy.description}
Keywords to look for: ${criteria.empathy.keywords.join(', ')}
Minimum score to pass: ${criteria.empathy.min_score}

2. CLARITY (0-100):
${criteria.clarity.description}
Requirements: ${criteria.clarity.requirements.join(', ')}
Minimum score to pass: ${criteria.clarity.min_score}

3. PROBLEM-SOLVING (0-100):
${criteria.problem_solving.description}
Required number of solutions: ${criteria.problem_solving.required_solutions}
Minimum score to pass: ${criteria.problem_solving.min_score}

4. PROFESSIONALISM (0-100):
${criteria.professionalism.description}
Avoid phrases: ${criteria.professionalism.avoid_phrases.join(', ')}
Required behaviors: ${criteria.professionalism.required_behaviors.join(', ')}
Minimum score to pass: ${criteria.professionalism.min_score}

Provide your evaluation as a JSON object with this exact structure:
{
  "scores": {
    "empathy": number,
    "clarity": number,
    "problem_solving": number,
    "professionalism": number,
    "overall": number (average)
  },
  "detailed_feedback": {
    "empathy": {
      "score": number,
      "what_went_well": ["point 1", "point 2"],
      "areas_for_improvement": ["point 1", "point 2"],
      "specific_examples": ["example 1 from transcript"]
    },
    "clarity": { ... same structure ... },
    "problem_solving": { ... same structure ... },
    "professionalism": { ... same structure ... }
  },
  "overall_summary": "2-3 sentence summary",
  "best_practices": ["practice 1", "practice 2", "practice 3"],
  "key_mistakes": ["mistake 1", "mistake 2"],
  "improvement_recommendations": ["recommendation 1", "recommendation 2"]
}`;
}

// Text-to-Speech
export async function generateSpeech(text: string): Promise<Buffer> {
  const mp3 = await openai.audio.speech.create({
    model: 'tts-1',
    voice: 'alloy', // or nova, echo, etc.
    input: text,
    speed: 1.0
  });

  const buffer = Buffer.from(await mp3.arrayBuffer());
  return buffer;
}
```

### ElevenLabs Integration (Alternative TTS)

```typescript
// lib/ai/elevenlabs.ts

export async function generateSpeechElevenLabs(
  text: string,
  voiceId: string = 'default'
): Promise<Buffer> {
  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': process.env.ELEVENLABS_API_KEY
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75
        }
      })
    }
  );

  if (!response.ok) {
    throw new Error('TTS generation failed');
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  return buffer;
}
```

### API Route Examples

```typescript
// app/api/ai/transcribe/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { transcribeAudio } from '@/lib/ai/openai';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;

    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }

    const transcript = await transcribeAudio(audioFile);

    return NextResponse.json({ transcript });
  } catch (error) {
    console.error('Transcription error:', error);
    return NextResponse.json(
      { error: 'Transcription failed' },
      { status: 500 }
    );
  }
}
```

```typescript
// app/api/sessions/[id]/message/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { generateAIGuestResponse, generateSpeech } from '@/lib/ai/openai';
import { uploadToS3 } from '@/lib/storage';
import { getSession, getScenario } from '@/lib/api';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { message, conversation_history } = await request.json();
    const sessionId = params.id;

    // Get session and scenario
    const session = await getSession(sessionId);
    const scenario = await getScenario(session.scenario_id);

    // Generate AI response
    const aiResponse = await generateAIGuestResponse(
      scenario,
      conversation_history,
      message
    );

    // Generate audio
    const audioBuffer = await generateSpeech(aiResponse);

    // Upload audio to S3
    const audioUrl = await uploadToS3(
      audioBuffer,
      `sessions/${sessionId}/audio-${Date.now()}.mp3`
    );

    return NextResponse.json({
      ai_response: aiResponse,
      audio_url: audioUrl
    });
  } catch (error) {
    console.error('Message processing error:', error);
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    );
  }
}
```

---

## Multi-Tenancy & Authentication

### Row-Level Security (RLS) with Supabase

```sql
-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenario_assignments ENABLE ROW LEVEL SECURITY;

-- Organizations: Users can only see their own organization
CREATE POLICY "Users can view own organization"
  ON organizations FOR SELECT
  USING (id = (SELECT organization_id FROM users WHERE auth_provider_id = auth.uid()));

CREATE POLICY "Admins can update own organization"
  ON organizations FOR UPDATE
  USING (
    id = (SELECT organization_id FROM users WHERE auth_provider_id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM users
      WHERE auth_provider_id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- Users: Users can see others in same organization
CREATE POLICY "Users can view organization members"
  ON users FOR SELECT
  USING (
    organization_id = (SELECT organization_id FROM users WHERE auth_provider_id = auth.uid())
    OR role = 'super_admin'
  );

-- Scenarios: Global scenarios visible to all, custom scenarios only to organization
CREATE POLICY "View scenarios"
  ON scenarios FOR SELECT
  USING (
    is_global = true
    OR organization_id = (SELECT organization_id FROM users WHERE auth_provider_id = auth.uid())
  );

CREATE POLICY "Managers can create scenarios"
  ON scenarios FOR INSERT
  WITH CHECK (
    organization_id = (SELECT organization_id FROM users WHERE auth_provider_id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM users
      WHERE auth_provider_id = auth.uid()
      AND role IN ('manager', 'admin', 'super_admin')
    )
  );

CREATE POLICY "Managers can update own organization scenarios"
  ON scenarios FOR UPDATE
  USING (
    organization_id = (SELECT organization_id FROM users WHERE auth_provider_id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM users
      WHERE auth_provider_id = auth.uid()
      AND role IN ('manager', 'admin', 'super_admin')
    )
  );

-- Training sessions: Users can only see own sessions, managers can see team sessions
CREATE POLICY "Users view own sessions"
  ON training_sessions FOR SELECT
  USING (
    trainee_id = (SELECT id FROM users WHERE auth_provider_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM users u1
      INNER JOIN users u2 ON u1.organization_id = u2.organization_id
      WHERE u1.auth_provider_id = auth.uid()
      AND u1.role IN ('manager', 'admin', 'super_admin')
      AND u2.id = training_sessions.trainee_id
    )
  );

CREATE POLICY "Users create own sessions"
  ON training_sessions FOR INSERT
  WITH CHECK (
    trainee_id = (SELECT id FROM users WHERE auth_provider_id = auth.uid())
  );
```

### Authentication Setup

```typescript
// lib/auth/supabase.ts

import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Get current user
export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  // Get user profile with organization
  const { data: profile } = await supabase
    .from('users')
    .select('*, organization:organizations(*)')
    .eq('auth_provider_id', user.id)
    .single();

  return profile;
}

// Check permissions
export async function hasPermission(
  action: string,
  resource: string
): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;

  const permissions = {
    trainee: {
      scenarios: ['view_assigned', 'practice'],
      sessions: ['view_own', 'create_own']
    },
    manager: {
      scenarios: ['view_all', 'create', 'edit', 'delete'],
      sessions: ['view_team'],
      team: ['view', 'assign']
    },
    admin: {
      '*': ['*']
    },
    super_admin: {
      '*': ['*']
    }
  };

  const userPermissions = permissions[user.role] || {};

  if (userPermissions['*']?.includes('*')) return true;
  if (userPermissions[resource]?.includes('*')) return true;
  if (userPermissions[resource]?.includes(action)) return true;

  return false;
}
```

### Middleware for Route Protection

```typescript
// middleware.ts

import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req: request, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Protected routes
  const protectedPaths = ['/dashboard', '/scenarios', '/sessions', '/team', '/analytics'];
  const isProtectedPath = protectedPaths.some(path =>
    request.nextUrl.pathname.startsWith(path)
  );

  if (isProtectedPath && !session) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Manager-only routes
  const managerPaths = ['/scenarios/new', '/team', '/analytics'];
  const isManagerPath = managerPaths.some(path =>
    request.nextUrl.pathname.startsWith(path)
  );

  if (isManagerPath && session) {
    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('auth_provider_id', session.user.id)
      .single();

    if (user?.role === 'trainee') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return res;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
```

---

## User Roles & Permissions

### Permission Matrix

```typescript
// config/permissions.ts

export enum UserRole {
  TRAINEE = 'trainee',
  MANAGER = 'manager',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin'
}

export enum Permission {
  // Scenarios
  VIEW_GLOBAL_SCENARIOS = 'view_global_scenarios',
  VIEW_ORG_SCENARIOS = 'view_org_scenarios',
  CREATE_SCENARIOS = 'create_scenarios',
  EDIT_SCENARIOS = 'edit_scenarios',
  DELETE_SCENARIOS = 'delete_scenarios',
  CLONE_SCENARIOS = 'clone_scenarios',
  TEST_SCENARIOS = 'test_scenarios',

  // Sessions
  CREATE_SESSION = 'create_session',
  VIEW_OWN_SESSIONS = 'view_own_sessions',
  VIEW_TEAM_SESSIONS = 'view_team_sessions',
  VIEW_ORG_SESSIONS = 'view_org_sessions',

  // Users
  VIEW_TEAM = 'view_team',
  INVITE_USERS = 'invite_users',
  MANAGE_USERS = 'manage_users',

  // Analytics
  VIEW_OWN_ANALYTICS = 'view_own_analytics',
  VIEW_TEAM_ANALYTICS = 'view_team_analytics',
  VIEW_ORG_ANALYTICS = 'view_org_analytics',

  // Assignments
  ASSIGN_SCENARIOS = 'assign_scenarios',

  // Organization
  MANAGE_ORGANIZATION = 'manage_organization',
  MANAGE_BILLING = 'manage_billing'
}

export const rolePermissions: Record<UserRole, Permission[]> = {
  [UserRole.TRAINEE]: [
    Permission.VIEW_GLOBAL_SCENARIOS,
    Permission.VIEW_ORG_SCENARIOS,
    Permission.CREATE_SESSION,
    Permission.VIEW_OWN_SESSIONS,
    Permission.VIEW_OWN_ANALYTICS
  ],

  [UserRole.MANAGER]: [
    Permission.VIEW_GLOBAL_SCENARIOS,
    Permission.VIEW_ORG_SCENARIOS,
    Permission.CREATE_SCENARIOS,
    Permission.EDIT_SCENARIOS,
    Permission.DELETE_SCENARIOS,
    Permission.CLONE_SCENARIOS,
    Permission.TEST_SCENARIOS,
    Permission.CREATE_SESSION,
    Permission.VIEW_OWN_SESSIONS,
    Permission.VIEW_TEAM_SESSIONS,
    Permission.VIEW_TEAM,
    Permission.INVITE_USERS,
    Permission.VIEW_OWN_ANALYTICS,
    Permission.VIEW_TEAM_ANALYTICS,
    Permission.ASSIGN_SCENARIOS
  ],

  [UserRole.ADMIN]: [
    // All manager permissions plus:
    ...rolePermissions[UserRole.MANAGER],
    Permission.VIEW_ORG_SESSIONS,
    Permission.MANAGE_USERS,
    Permission.VIEW_ORG_ANALYTICS,
    Permission.MANAGE_ORGANIZATION,
    Permission.MANAGE_BILLING
  ],

  [UserRole.SUPER_ADMIN]: Object.values(Permission) // All permissions
};

export function hasPermission(userRole: UserRole, permission: Permission): boolean {
  return rolePermissions[userRole]?.includes(permission) || false;
}

export function hasAnyPermission(
  userRole: UserRole,
  permissions: Permission[]
): boolean {
  return permissions.some(permission => hasPermission(userRole, permission));
}
```

---

## Deployment Architecture

### Environment Variables

```bash
# .env.local

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Database
DATABASE_URL=postgresql://user:password@host:5432/hospitalityai
DIRECT_URL=postgresql://user:password@host:5432/hospitalityai

# Authentication
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# AI Services
OPENAI_API_KEY=sk-...
ELEVENLABS_API_KEY=...

# File Storage
# Option 1: Supabase Storage
NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET=videos

# Option 2: AWS S3
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
AWS_S3_BUCKET=hospitalityai-videos

# Optional
SENTRY_DSN=...
VERCEL_ANALYTICS_ID=...
```

### Vercel Deployment Configuration

```json
// vercel.json

{
  "buildCommand": "pnpm build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "regions": ["iad1"],
  "env": {
    "NEXT_PUBLIC_APP_URL": "@app-url",
    "DATABASE_URL": "@database-url",
    "OPENAI_API_KEY": "@openai-key",
    "SUPABASE_SERVICE_ROLE_KEY": "@supabase-service-key"
  },
  "functions": {
    "app/api/**/*": {
      "maxDuration": 60
    }
  }
}
```

### Infrastructure Diagram

```
┌──────────────────────────────────────────────────────────┐
│                    Vercel Edge Network                    │
│  ┌────────────────────────────────────────────────────┐  │
│  │              Next.js Application                   │  │
│  │  - SSR Pages                                       │  │
│  │  - API Routes                                      │  │
│  │  - Static Assets (CDN cached)                     │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
              │                    │                  │
              ▼                    ▼                  ▼
┌────────────────────┐  ┌──────────────────┐  ┌─────────────────┐
│  Supabase/Neon     │  │   OpenAI API     │  │ Supabase        │
│  (PostgreSQL)      │  │   - GPT-4        │  │ Storage / S3    │
│                    │  │   - Whisper      │  │                 │
│  - Users           │  │   - TTS          │  │ - Videos        │
│  - Organizations   │  │                  │  │ - Audio files   │
│  - Scenarios       │  │  ElevenLabs      │  │ - Avatars       │
│  - Sessions        │  │   - TTS (alt)    │  │                 │
│  - Evaluations     │  │                  │  │                 │
└────────────────────┘  └──────────────────┘  └─────────────────┘
```

---

## Implementation Roadmap

### Phase 1: MVP (CodeFest 2025 Demo) - 2-3 weeks

**Week 1: Foundation**
- [ ] Set up Next.js project with TypeScript
- [ ] Configure Supabase (database + auth + storage)
- [ ] Create database schema and migrations
- [ ] Set up authentication (login/signup)
- [ ] Create basic layouts and navigation
- [ ] Implement user roles and permissions

**Week 2: Core Training Experience**
- [ ] Build scenario list and detail pages
- [ ] Implement video capture with react-webcam
- [ ] Integrate MediaRecorder for recording
- [ ] Set up voice activity detection
- [ ] Integrate Whisper API for transcription
- [ ] Build conversation flow with GPT-4
- [ ] Implement TTS for AI responses
- [ ] Create training session UI

**Week 3: Evaluation & Manager Features**
- [ ] Build evaluation engine with GPT-4
- [ ] Create evaluation results page
- [ ] Implement scenario builder (basic version)
- [ ] Add manager dashboard
- [ ] Create 3-5 pre-built scenarios
- [ ] Video upload and storage
- [ ] Polish UI/UX

**Demo Deliverables:**
- ✅ 3-5 working scenarios (global templates)
- ✅ Complete trainee experience (practice → evaluation)
- ✅ Basic manager dashboard with scenario builder
- ✅ Demonstration of custom scenario creation
- ✅ Video recording and playback
- ✅ Real-time AI conversation
- ✅ Evaluation with detailed feedback

---

### Phase 2: Production Ready - 4-6 weeks

**Features:**
- [ ] Complete manager analytics dashboard
- [ ] Scenario assignments system
- [ ] Team management (invite users, etc.)
- [ ] Advanced scenario builder with templates
- [ ] Scenario versioning
- [ ] Session history and progress tracking
- [ ] Email notifications
- [ ] Export reports (PDF)
- [ ] Mobile-responsive design
- [ ] Error handling and recovery
- [ ] Performance optimizations

**Infrastructure:**
- [ ] Production deployment (Vercel)
- [ ] Database backups
- [ ] Monitoring (Sentry)
- [ ] Rate limiting
- [ ] CDN optimization for videos
- [ ] Caching strategy

---

### Phase 3: Advanced Features - 8-12 weeks

**AI Enhancements:**
- [ ] Facial expression analysis (Hume AI)
- [ ] Tone analysis from audio
- [ ] Real-time coaching hints
- [ ] Adaptive difficulty
- [ ] AI avatar integration (D-ID/HeyGen)

**Platform Features:**
- [ ] Multi-language support
- [ ] Scenario marketplace (share scenarios)
- [ ] Achievement system and badges
- [ ] Leaderboards
- [ ] Admin super dashboard
- [ ] White-label options
- [ ] API for integrations
- [ ] Mobile apps (React Native)

**Business Features:**
- [ ] Subscription tiers and billing (Stripe)
- [ ] Usage limits enforcement
- [ ] Enterprise SSO
- [ ] Custom branding
- [ ] Dedicated support portal

---

## Cost Estimates (Monthly)

### For 100 Training Sessions/Month:

**Infrastructure:**
- Vercel Pro: $20
- Supabase Pro: $25
- PostgreSQL (Neon): Included
- Video Storage (50GB): ~$1-2

**AI Services:**
- OpenAI (GPT-4 + Whisper + TTS):
  - Conversations: ~$50-100
  - Transcription: ~$10-20
  - TTS: ~$5-10
  - Evaluations: ~$20-30
- Total AI: ~$85-160

**Total: ~$130-210/month for 100 sessions**

**Per Session Cost: ~$1.30-2.10**

### For 1,000 Sessions/Month:
- Infrastructure: $100-150
- AI Services: $800-1,500
- **Total: ~$900-1,650/month**
- **Per Session: ~$0.90-1.65**

---

## Success Metrics & KPIs

### Technical Metrics
- [ ] Session completion rate > 90%
- [ ] Average session load time < 3s
- [ ] Video upload success rate > 95%
- [ ] Transcription accuracy > 90%
- [ ] Average evaluation time < 30s
- [ ] System uptime > 99.5%

### User Metrics
- [ ] User satisfaction (CSAT) > 4.5/5
- [ ] Manager adoption rate > 70%
- [ ] Custom scenario creation rate > 2/manager/month
- [ ] Average sessions per trainee > 5/month
- [ ] Scenario completion rate > 80%

### Business Metrics
- [ ] Cost per session < $2
- [ ] Monthly recurring revenue growth
- [ ] Customer churn < 5%
- [ ] NPS score > 50

---

## Security Considerations

### Data Protection
- [ ] Encrypt videos at rest (S3 server-side encryption)
- [ ] Encrypt sensitive data in database
- [ ] Use HTTPS everywhere
- [ ] Implement CORS properly
- [ ] Rate limiting on API endpoints
- [ ] Input validation and sanitization

### Privacy
- [ ] GDPR compliance (data deletion, export)
- [ ] Clear privacy policy
- [ ] User consent for recording
- [ ] Data retention policies
- [ ] Right to be forgotten

### Authentication & Authorization
- [ ] Strong password requirements
- [ ] Email verification
- [ ] Session timeout
- [ ] Role-based access control (RBAC)
- [ ] Row-level security (RLS)
- [ ] API key rotation

---

## Testing Strategy

### Unit Tests
- [ ] API route handlers
- [ ] Utility functions
- [ ] Evaluation logic
- [ ] Permission checks

### Integration Tests
- [ ] Authentication flow
- [ ] Session creation and completion
- [ ] Video upload pipeline
- [ ] AI service integration

### E2E Tests
- [ ] Complete training session flow
- [ ] Scenario builder flow
- [ ] Manager dashboard workflows

### Performance Tests
- [ ] Load testing (multiple concurrent sessions)
- [ ] Video upload performance
- [ ] Database query optimization

---

## Documentation

### For Developers
- [ ] Setup guide
- [ ] Architecture documentation
- [ ] API documentation
- [ ] Database schema documentation
- [ ] Deployment guide
- [ ] Contributing guidelines

### For Users
- [ ] Trainee guide
- [ ] Manager guide
- [ ] Admin guide
- [ ] FAQ
- [ ] Video tutorials
- [ ] Best practices

---

## Support & Maintenance

### Monitoring
- Application performance (Vercel Analytics)
- Error tracking (Sentry)
- User analytics (Mixpanel/Amplitude)
- API usage and costs
- Database performance

### Maintenance Tasks
- Weekly database backups
- Monthly dependency updates
- Quarterly security audits
- AI model updates
- Performance optimization reviews

---

This technical specification provides a comprehensive blueprint for building the HospitalityAI Training Simulator. Each section can be expanded as needed during development.
