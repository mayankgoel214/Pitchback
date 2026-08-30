# Setup Guide - HospitalityAI Training Simulator

## Prerequisites

- **Node.js 18+** (check with `node --version`)
- **npm** or **pnpm** (comes with Node.js)
- **OpenAI API Key** with GPT-4 access

## Step 1: Install Dependencies

```bash
npm install
# or if you prefer pnpm:
# pnpm install
```

## Step 2: Configure Environment Variables

The app needs an OpenAI API key to function. A `.env.local` file has been created for you.

### Get Your OpenAI API Key

1. Go to https://platform.openai.com/api-keys
2. Sign in or create an account
3. Click "Create new secret key"
4. Copy the key (starts with `sk-...`)

### Add Your API Key

Open `.env.local` and replace `your_openai_api_key_here` with your actual key:

```env
OPENAI_API_KEY=sk-proj-your-actual-key-here
```

**Important Notes:**
- You need **GPT-4 access** on your OpenAI account (not just GPT-3.5)
- The app uses GPT-4 for conversations and GPT-4o for evaluations
- TTS (text-to-speech) uses OpenAI's TTS API, but falls back to browser speech if it fails
- Speech-to-text uses the browser's Web Speech API (no API key needed)

### Optional Configuration

If you have an organization or project-specific key, you can also set:

```env
OPENAI_ORG_ID=org-xxxxx
OPENAI_PROJECT_ID=proj_xxxxx
```

## Step 3: Run the Development Server

```bash
npm run dev
```

The app will start at **http://localhost:3000**

## Step 4: Test the App

1. Open http://localhost:3000 in your browser
2. You should see the landing page
3. Click "Start Training" or navigate to `/scenarios`
4. Select a scenario (e.g., "Angry Guest - Billing Dispute")
5. Click "Start Practice"
6. Grant microphone permissions when prompted
7. Click the microphone button and start speaking to practice!

## Troubleshooting

### "API Key not found" error

- Make sure your `.env.local` file is in the root directory
- Verify the key starts with `sk-` (old keys) or `sk-proj-` (new project keys)
- Restart the dev server after adding the key

### "Insufficient quota" error

- Your OpenAI account needs credits/billing enabled
- Check your usage at https://platform.openai.com/usage

### "Model not found" error

- You need GPT-4 API access (not available on all accounts)
- Free tier accounts may not have GPT-4 access
- You may need to add credits to your account

### Speech recognition not working

- Make sure you're using Chrome, Edge, or Safari (Firefox may not support it)
- Check that you granted microphone permissions
- The speech recognition uses browser APIs, not OpenAI

### TTS (voice) not working

- If OpenAI TTS fails, it automatically falls back to browser speech synthesis
- Check browser console for error messages
- Make sure your OpenAI API key has access to the TTS API

## Architecture Overview

This is a **demo/MVP version** that:
- Uses **file-based mock data** (no database setup needed)
- Runs in **demo mode** (no authentication required)
- Stores session results in **localStorage**

### What APIs are used:

1. **OpenAI GPT-4** - AI guest conversation generation (lib/ai/openai.ts:94)
2. **OpenAI GPT-4o** - Session evaluation (lib/ai/openai.ts:254)
3. **OpenAI TTS** - Text-to-speech for AI guest (app/api/ai/tts/route.ts)
4. **Web Speech API** - Browser-based speech recognition (no API needed)

### File Structure:

```
codefest25/
├── .env.local          # Your API keys (git-ignored)
├── app/
│   ├── page.tsx        # Landing page
│   ├── scenarios/      # Scenario pages
│   └── api/            # API routes
├── lib/
│   ├── ai/
│   │   ├── openai.ts           # Main AI logic
│   │   └── emotion-engine.ts   # Emotion tracking
│   └── types/          # TypeScript types
├── data/               # Mock scenario data
└── package.json        # Dependencies
```

## Next Steps

Once you have it running:

1. Try all 3 scenarios to see different difficulty levels
2. Check the **AI Insights panel** during practice (shows emotion, escalation, performance)
3. Review the **evaluation results** after completing a session
4. Look at the **emotion tracking** in `lib/ai/emotion-engine.ts` to understand the 7-state FSM

## Development Commands

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

## Cost Estimates

Based on OpenAI pricing:
- **GPT-4 conversation**: ~$0.01-0.03 per session
- **GPT-4o evaluation**: ~$0.005-0.01 per session
- **TTS**: ~$0.001-0.003 per session
- **Total per session**: ~$0.015-0.04

A full practice session (10 turns) costs about **1-4 cents**.

## Support

If you run into issues:
1. Check the browser console for errors
2. Check the terminal/server logs
3. Verify your API key is correct and has credits
4. Make sure you're using a supported browser (Chrome recommended)

Happy training! 🚀
