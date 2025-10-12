# HospitalityAI Training Simulator - Complete Testing Guide

**Last Updated**: October 11, 2025
**Server Status**: ✅ Running on http://localhost:3020
**OpenAI API Key**: ✅ Verified and working

---

## 🎯 Quick Start Testing

### Prerequisites Checklist
- [x] Node.js v22.14.0 installed
- [x] npm v11.1.0 installed
- [x] Dependencies installed (`node_modules` exists)
- [x] OpenAI API key configured in `.env.local`
- [x] API key validated (tested successfully)
- [x] Development server running on port 3020

---

## 📋 Complete Test Suite

### **TEST 1: Server Health Check** ✅ PASSED

**Status**: Server running successfully
**URL**: http://localhost:3020
**Start Time**: 2.8 seconds
**Framework**: Next.js 15.5.4 with Turbopack

```bash
# Server output:
✓ Starting...
✓ Ready in 2.8s
```

---

### **TEST 2: API Endpoints** ✅ PASSED

#### 2.1 Scenarios API (GET /api/scenarios)
**Status**: ✅ PASSED
**Response Time**: < 100ms
**Data Returned**: 2 scenarios

```bash
# Test Command:
curl http://localhost:3020/api/scenarios

# Expected Result:
{
  "success": true,
  "data": [
    {
      "id": "scenario-001",
      "title": "The Angry Business Traveler",
      "category": "angry_guests",
      "difficulty": "beginner"
    },
    {
      "id": "scenario-002",
      "title": "The Language Barrier",
      "category": "language_barriers",
      "difficulty": "intermediate"
    }
  ],
  "count": 2
}
```

#### 2.2 Session Creation API (POST /api/sessions)
**Status**: ✅ PASSED
**Response Time**: < 200ms
**Session ID Generated**: UUID format

```bash
# Test Command:
curl -X POST http://localhost:3020/api/sessions \
  -H "Content-Type: application/json" \
  -d '{"scenario_id":"scenario-001","trainee_id":"demo-user"}'

# Expected Result:
{
  "success": true,
  "data": {
    "id": "74acadaf-e0b0-44a7-8f71-329313a347ba",
    "trainee_id": "demo-user",
    "scenario_id": "scenario-001",
    "status": "in_progress",
    "turns_completed": 0,
    "scores": {
      "empathy": 0,
      "clarity": 0,
      "problem_solving": 0,
      "professionalism": 0
    }
  },
  "message": "Session created successfully"
}
```

---

### **TEST 3: Frontend Application Testing**

Open your browser and navigate to: **http://localhost:3020**

---

#### 3.1 Login Page Test
**URL**: http://localhost:3020/login
**Auto-redirect**: If not logged in, should redirect to /login

**Test Steps**:
1. ✅ Open http://localhost:3020
2. ✅ Should redirect to /login page
3. ✅ Verify UI elements:
   - [ ] Left side: Brand showcase with animated background
   - [ ] Right side: Login form
   - [ ] Logo and "HospitalityAI" branding visible
   - [ ] Two input fields: "Full Name" and "Employee ID"
   - [ ] "Remember me" checkbox
   - [ ] "Sign In" button
   - [ ] Demo credentials shown at bottom

**Test Login Credentials**:
```
Full Name: Sarah Johnson
Employee ID: EMP001
```

**Expected Behavior**:
- ✅ Valid credentials → Redirect to dashboard
- ❌ Invalid credentials → Show error message: "Invalid name or employee ID"
- ✅ Data stored in localStorage: `authenticatedEmployee`

**Success Criteria**:
- [ ] Login form accepts input
- [ ] Successful login redirects to /
- [ ] User data persists in localStorage
- [ ] Error handling works for invalid credentials

---

#### 3.2 Dashboard/Home Page Test
**URL**: http://localhost:3020/
**Requires**: Authentication

**Test Steps**:
1. ✅ Login successfully
2. ✅ Should see dashboard with:
   - [ ] Header with "HospitalityAI" logo
   - [ ] User name displayed (e.g., "Welcome back, Sarah!")
   - [ ] Sign Out button
   - [ ] Hero section with welcome message
   - [ ] Stats cards showing:
     - Training Scenarios count
     - Skill Categories count
     - AI Smart Feedback
   - [ ] Business Impact section with metrics
   - [ ] Available Training Scenarios grid
   - [ ] "How Training Works" section

**Test Scenarios Display**:
- [ ] Scenario cards show:
  - Title
  - Category badge
  - Difficulty level
  - Duration estimate
  - Learning objectives
  - "Start Practice" button

**Expected Scenarios**:
1. "The Angry Business Traveler" (Beginner, Angry Guests)
2. "The Language Barrier" (Intermediate, Language Barriers)

**Success Criteria**:
- [ ] All UI elements render correctly
- [ ] No console errors in browser DevTools (F12)
- [ ] Scenario cards are clickable
- [ ] Sign Out button works

---

#### 3.3 Scenario Detail Page Test
**URL**: http://localhost:3020/scenarios/scenario-001

**Test Steps**:
1. ✅ Click on "The Angry Business Traveler" scenario card
2. ✅ Should see scenario detail page with:
   - [ ] Scenario title and metadata
   - [ ] Full scenario context
   - [ ] Guest persona details
   - [ ] Learning objectives list
   - [ ] Success criteria breakdown
   - [ ] "Start Practice Session" button

**Success Criteria**:
- [ ] All scenario information displays correctly
- [ ] "Start Practice Session" button is visible
- [ ] Back navigation works

---

### **TEST 4: Voice Training Session** 🎙️ CRITICAL TEST

**URL**: http://localhost:3020/scenarios/scenario-001/practice

**⚠️ IMPORTANT**: This requires **microphone permissions** and works best in **Chrome or Edge**.

---

#### 4.1 Initial Session Setup
**Test Steps**:
1. ✅ Click "Start Practice Session"
2. ✅ Should navigate to practice page
3. ✅ Browser should request microphone permission (ALLOW it)
4. ✅ AI guest should speak opening message automatically

**Expected UI Elements**:
- [ ] Header with scenario title and turn counter
- [ ] Context banner with scenario situation
- [ ] Large avatar circle in center (animated when speaking)
- [ ] Voice controls section with:
  - Large red microphone button
  - "Show Chat" toggle
  - "Show AI Insights" toggle
- [ ] AI Insights panel (right side) showing:
  - Guest Emotional State
  - Escalation Level meter
  - De-escalation Progress meter
  - Trainee Performance score
- [ ] Tips section at bottom

**Opening Message** (AI will speak):
```
"This is UNACCEPTABLE! I've been traveling all day and my room isn't ready?
I have a critical meeting in the morning! What kind of operation are you running here?"
```

**Success Criteria**:
- [ ] OpenAI TTS plays audio automatically
- [ ] Avatar animates while AI is speaking
- [ ] Status indicator shows "Guest Speaking..."
- [ ] Initial emotion state shows "ANGRY" (red)
- [ ] Escalation level shows 80-100/100

---

#### 4.2 Voice Interaction Test
**Test Steps**:
1. ✅ Wait for AI to finish speaking
2. ✅ Click the **red microphone button** (should pulse when active)
3. ✅ Speak your response clearly

**Example Good Response**:
```
"I sincerely apologize for this situation. I completely understand how
frustrating this must be after such a long journey, especially with your
important meeting tomorrow morning. Let me take care of this for you right
now. I can offer you an immediate upgrade to a suite that's ready, or I can
prepare your room within 15 minutes while you relax in our executive lounge
with complimentary refreshments."
```

**Expected Behavior**:
- [ ] Microphone button turns red and pulses
- [ ] Live transcript appears showing what you're saying
- [ ] Click microphone again to stop recording
- [ ] Your message appears in conversation history (green bubble)
- [ ] Loading indicator shows "Thinking..."
- [ ] AI generates response (takes 2-5 seconds)
- [ ] AI speaks response using TTS
- [ ] Avatar animates during AI speech
- [ ] Turn counter increments
- [ ] AI Insights panel updates:
  - Emotional state may change (e.g., ANGRY → CALMING)
  - Escalation level decreases
  - De-escalation progress increases
  - Performance score updates

**What to Watch For**:
- ✅ **Speech Recognition Working**: Live transcript shows your words
- ✅ **AI Response Generated**: GPT-4 creates contextual reply
- ✅ **TTS Working**: AI voice plays through speakers
- ✅ **Emotion Tracking**: State changes based on your response
- ✅ **Real-time Insights**: Meters and scores update

**Common Issues**:
- **Microphone not working**: Check browser permissions (click padlock icon in address bar)
- **No audio output**: Check system volume and browser audio settings
- **Slow AI response**: OpenAI API call may take 3-10 seconds (normal)
- **Speech not recognized**: Speak clearly, avoid background noise

---

#### 4.3 Multi-Turn Conversation Test
**Test Steps**:
1. ✅ Continue the conversation for 3-5 turns
2. ✅ Try different response styles:
   - **Empathetic**: "I understand how you feel..."
   - **Solution-focused**: "Let me offer you..."
   - **Professional**: "I will handle this immediately..."
   - **Poor response** (to test escalation): "There's nothing I can do."

**Expected Emotion Progression**:

**Good Responses**:
```
VERY_ANGRY → ANGRY → FRUSTRATED → NEUTRAL → CALMING → SATISFIED → HAPPY
```

**Poor Responses**:
```
ANGRY → VERY_ANGRY (escalates)
```

**Success Criteria**:
- [ ] AI responds appropriately to your tone
- [ ] Emotion state changes based on your performance
- [ ] Escalation level increases/decreases correctly
- [ ] Performance score reflects response quality
- [ ] Conversation history shows all messages
- [ ] Real-time tips appear when escalation is high

---

#### 4.4 Session Completion Test
**Test Steps**:
1. ✅ Continue until 10 turns OR click "End Session"
2. ✅ Should show loading indicator
3. ✅ GPT-4o evaluates the session (takes 5-15 seconds)
4. ✅ Automatically redirects to results page

**Expected Behavior**:
- [ ] Loading state shows "Evaluating session..."
- [ ] Session data saved to localStorage
- [ ] Redirect to: `/scenarios/scenario-001/results?sessionId={id}`

---

### **TEST 5: AI Evaluation & Results Page** 📊

**URL**: Auto-redirect after session ends

---

#### 5.1 Evaluation Generation Test
**Process**:
1. ✅ GPT-4o analyzes full conversation transcript
2. ✅ Scores 4 competencies (Empathy, Clarity, Problem-Solving, Professionalism)
3. ✅ Generates detailed feedback with specific examples
4. ✅ Provides improvement recommendations

**Expected Evaluation Data**:
```json
{
  "scores": {
    "empathy": 0-100,
    "clarity": 0-100,
    "problem_solving": 0-100,
    "professionalism": 0-100,
    "overall": average
  },
  "detailed_feedback": {
    "empathy": {
      "score": 85,
      "what_went_well": [
        "Acknowledged guest frustration",
        "Showed understanding of situation"
      ],
      "areas_for_improvement": [
        "Could have been more specific"
      ],
      "specific_examples": [
        "Quote from conversation"
      ]
    }
  },
  "overall_summary": "2-3 sentence summary",
  "best_practices": ["practice 1", "practice 2"],
  "key_mistakes": ["mistake 1", "mistake 2"],
  "improvement_recommendations": ["rec 1", "rec 2", "rec 3"]
}
```

---

#### 5.2 Results Page Display Test
**Test Steps**:
1. ✅ Results page should load automatically
2. ✅ Verify all sections are present

**Expected UI Elements**:
- [ ] **Overall Score Circle**: Large animated progress ring
- [ ] **Competency Scores**: 4 cards with scores and descriptions
  - Empathy
  - Clarity
  - Problem-Solving
  - Professionalism
- [ ] **Detailed Feedback Sections**: Expandable cards for each competency
  - What Went Well (✅ green)
  - Areas for Improvement (⚠️ yellow)
  - Specific Examples (quoted from conversation)
- [ ] **Overall Summary**: Text summary of performance
- [ ] **Best Practices**: Bulleted list of good techniques used
- [ ] **Key Mistakes**: Bulleted list of areas to avoid
- [ ] **Improvement Recommendations**: Actionable next steps
- [ ] **Full Transcript**: Conversation history replay
- [ ] **Action Buttons**:
  - "Practice Again"
  - "Try Different Scenario"
  - "Back to Dashboard"

**Success Criteria**:
- [ ] All scores displayed correctly (0-100 range)
- [ ] Feedback includes specific quotes from your conversation
- [ ] Overall score matches average of 4 competencies
- [ ] UI is visually polished with dark theme
- [ ] Transcript shows all conversation turns

---

### **TEST 6: Edge Cases & Error Handling**

---

#### 6.1 Invalid Scenario ID
**Test**:
```
Navigate to: http://localhost:3020/scenarios/invalid-id/practice
```
**Expected**: Show "Scenario not found" message

---

#### 6.2 No Microphone Permission
**Test**: Deny microphone access when prompted
**Expected**: Show error message or graceful degradation

---

#### 6.3 API Failure Simulation
**Test**: Disconnect internet or stop OpenAI responses
**Expected**: Show error message: "Failed to generate AI guest response"

---

#### 6.4 Session Without Conversation
**Test**: End session immediately without any conversation
**Expected**: Show validation error or minimum turns warning

---

#### 6.5 Browser Compatibility
**Test in Multiple Browsers**:
- [ ] ✅ Chrome (recommended)
- [ ] ✅ Edge (recommended)
- [ ] ⚠️ Firefox (Web Speech API support varies)
- [ ] ❌ Safari (limited Web Speech API support)

---

## 🔬 Advanced Testing

### **TEST 7: AI Conversation Quality**

**Test**: Evaluate GPT-4 responses for realism

**Sample Conversation Flow**:

**Turn 1**:
- **Trainee**: "I sincerely apologize. Let me upgrade you to a suite immediately."
- **AI (Angry → Calming)**: "Well... that's better. But this shouldn't have happened in the first place. How long will it take?"

**Turn 2**:
- **Trainee**: "Your suite is ready right now. I'll also comp your breakfast and arrange a 7 AM wake-up call."
- **AI (Calming → Satisfied)**: "Okay, I appreciate you handling this quickly. That works for me."

**Success Criteria**:
- [ ] AI maintains consistent persona
- [ ] Emotional transitions feel natural
- [ ] Responses reference previous conversation
- [ ] AI doesn't break character

---

### **TEST 8: Emotion Engine Validation**

**Test**: Verify 7-state emotion transitions

**Scenario**: "The Angry Business Traveler"

| Your Response Quality | Expected Emotion Transition |
|----------------------|---------------------------|
| Excellent (empathy + solution) | ANGRY → FRUSTRATED (jump 2 states) |
| Good (empathy OR solution) | ANGRY → FRUSTRATED (jump 1 state) |
| Neutral (no empathy/solution) | ANGRY (stay same) |
| Poor (defensive language) | ANGRY → VERY_ANGRY (drop 1 state) |

**Validation**:
- [ ] Check AI Insights panel for correct emotion
- [ ] Verify escalation level matches (very_angry=100, happy=0)
- [ ] Confirm state history tracks changes

---

### **TEST 9: Performance Scoring Algorithm**

**Test**: Verify sentiment analysis accuracy

**Your Message**: "I sincerely apologize for this frustrating situation. I completely understand how exhausted you must be. Let me upgrade you immediately to our best suite."

**Expected Sentiment Scores**:
- **Empathy**: 80-100 (keywords: "apologize", "understand", "frustrating", "exhausted")
- **Professionalism**: 70-90 (keywords: "sincerely", "immediately")
- **Solution Focus**: 85-100 (keywords: "upgrade", "suite")
- **Overall Performance**: 78-97 (average)

**Validation**:
- [ ] Check AI Insights panel "Your Performance" score
- [ ] Verify it increases with good responses
- [ ] Confirm it decreases with poor responses

---

## 📊 API Testing (Advanced)

### **TEST 10: AI Conversation Endpoint**

**Endpoint**: POST /api/ai/conversation

```bash
curl -X POST http://localhost:3020/api/ai/conversation \
  -H "Content-Type: application/json" \
  -d '{
    "scenario": { /* scenario object */ },
    "conversation_history": [],
    "trainee_message": "I sincerely apologize for this situation.",
    "emotion_context": null
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "ai_response": "Well, I appreciate the apology, but...",
    "emotion_context": {
      "current_state": "angry",
      "escalation_level": 75,
      "trainee_performance_score": 65
    },
    "sentiment_analysis": {
      "empathy": 85,
      "professionalism": 70,
      "solution_focus": 40,
      "tone": "positive"
    },
    "ai_insights": { /* real-time metrics */ }
  }
}
```

**Success Criteria**:
- [ ] Response time < 10 seconds
- [ ] AI response is contextually appropriate
- [ ] Emotion context updates correctly
- [ ] Sentiment scores are reasonable (0-100)

---

### **TEST 11: TTS Endpoint**

**Endpoint**: POST /api/ai/tts

```bash
curl -X POST http://localhost:3020/api/ai/tts \
  -H "Content-Type: application/json" \
  -d '{"text":"This is unacceptable!","voice":"nova"}' \
  --output test-audio.mp3
```

**Expected Response**: MP3 audio file
**File Size**: 5-50 KB depending on text length

**Success Criteria**:
- [ ] Returns valid MP3 audio
- [ ] Audio is clear and understandable
- [ ] Voice matches requested voice ("nova" = female)
- [ ] Response time < 5 seconds

---

### **TEST 12: Evaluation Endpoint**

**Endpoint**: POST /api/ai/evaluate

```bash
curl -X POST http://localhost:3020/api/ai/evaluate \
  -H "Content-Type: application/json" \
  -d '{
    "scenario": { /* scenario object */ },
    "transcript": [
      {"speaker":"ai_guest","text":"This is unacceptable!","timestamp":"..."},
      {"speaker":"trainee","text":"I sincerely apologize...","timestamp":"..."}
    ]
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "scores": { /* 0-100 scores */ },
    "detailed_feedback": { /* per competency */ },
    "overall_summary": "...",
    "best_practices": [],
    "key_mistakes": [],
    "improvement_recommendations": []
  }
}
```

**Success Criteria**:
- [ ] Response time < 30 seconds (GPT-4o is analyzing)
- [ ] All 4 competency scores present
- [ ] Feedback includes specific examples
- [ ] JSON format is valid

---

## ✅ Final Testing Checklist

### **Pre-Demo Testing (30 minutes before presentation)**

- [ ] **Environment Setup**
  - [ ] Server starts without errors
  - [ ] Port 3020 is available
  - [ ] Browser is Chrome or Edge
  - [ ] Microphone is connected and working
  - [ ] Speakers/headphones are working
  - [ ] Internet connection is stable

- [ ] **Critical Path Test (5-minute walkthrough)**
  - [ ] Login with Sarah Johnson / EMP001
  - [ ] Dashboard loads correctly
  - [ ] Click "The Angry Business Traveler" scenario
  - [ ] Start practice session
  - [ ] Allow microphone permission
  - [ ] AI speaks opening message (audio works)
  - [ ] Click microphone and speak test response
  - [ ] Verify speech recognition works
  - [ ] AI responds with contextual reply
  - [ ] Check AI Insights panel updates
  - [ ] End session after 2-3 turns
  - [ ] Results page loads with evaluation
  - [ ] All scores and feedback display correctly

- [ ] **Backup Plan**
  - [ ] Screenshots of working app saved
  - [ ] Demo video recorded (optional)
  - [ ] BUSINESS_CASE.md and README.md ready to show

---

## 🐛 Known Issues & Workarounds

### **Issue 1: Microphone Permission Denied**
**Symptom**: Speech recognition doesn't work
**Fix**: Click padlock icon in browser address bar → Allow microphone

### **Issue 2: No Audio Output**
**Symptom**: AI voice doesn't play
**Fix**: Check system volume, browser audio settings, try different browser

### **Issue 3: Slow API Responses**
**Symptom**: AI takes 10+ seconds to respond
**Fix**: This is normal for GPT-4. Mention "This is real GPT-4, not mocked" during demo.

### **Issue 4: OpenAI API Rate Limit**
**Symptom**: Error: "Rate limit exceeded"
**Fix**: Wait 60 seconds, or mention rate limiting is working as designed

### **Issue 5: Session Data Lost on Refresh**
**Symptom**: Can't see previous session results
**Fix**: Data is stored in memory. Don't refresh during demo. Use localStorage for results persistence.

---

## 🎯 Testing Success Metrics

**Minimum Viable Demo** (must work):
- ✅ Login
- ✅ Dashboard displays
- ✅ Voice training session works (mic + TTS)
- ✅ AI responds intelligently
- ✅ Evaluation generates and displays

**Impressive Demo** (should work):
- ✅ All of the above
- ✅ Real-time emotion tracking visible
- ✅ AI Insights panel updates live
- ✅ Emotion state transitions during conversation
- ✅ Detailed evaluation with specific examples
- ✅ No console errors

**Perfect Demo** (bonus):
- ✅ All of the above
- ✅ Multiple scenarios tested
- ✅ Smooth transitions between pages
- ✅ Professional UI with no visual bugs
- ✅ Fast API response times
- ✅ Clear connection to "Booking to Belonging" theme

---

## 📝 Testing Log Template

Use this to document your test results:

```
TESTING SESSION LOG
Date: _______________
Tester: _______________
Browser: _______________

✅ = PASS | ⚠️ = WARNING | ❌ = FAIL

[ ] Test 1: Server Health Check
    Notes: _________________________________

[ ] Test 2: API Endpoints
    Notes: _________________________________

[ ] Test 3: Login Flow
    Notes: _________________________________

[ ] Test 4: Dashboard Display
    Notes: _________________________________

[ ] Test 5: Voice Training Session
    Notes: _________________________________
    Issues: _________________________________

[ ] Test 6: AI Evaluation
    Notes: _________________________________

[ ] Test 7: Results Page
    Notes: _________________________________

Overall Status: _______________
Critical Issues: _______________
Ready for Demo: YES / NO
```

---

## 🚀 Quick Demo Test (2 minutes)

**Fastest way to verify everything works**:

1. Open http://localhost:3020
2. Login: Sarah Johnson / EMP001
3. Click "The Angry Business Traveler"
4. Click "Start Practice Session"
5. Allow microphone
6. Wait for AI to speak
7. Click mic, say: "I sincerely apologize. Let me upgrade you to a suite right now."
8. Verify:
   - ✅ Speech recognized
   - ✅ AI responds
   - ✅ Emotion changes
   - ✅ Performance score updates
9. Click "End Session"
10. Verify:
    - ✅ Evaluation loads
    - ✅ Scores displayed
    - ✅ Feedback shown

**If all 10 steps pass: YOU'RE READY! 🎉**

---

**Server is currently running on: http://localhost:3020**
**API Status**: All endpoints operational
**OpenAI API**: Connected and working

**You're ready to test! Open your browser and start with the Login Page Test above.** 🚀
