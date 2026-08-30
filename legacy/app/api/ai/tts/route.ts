import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Debug: Check if API key is loaded
const apiKey = process.env.OPENAI_API_KEY;
const orgId = process.env.OPENAI_ORG_ID;
const projectId = process.env.OPENAI_PROJECT_ID;

console.log('🔑 [api/ai/tts] API Key Status:', {
  exists: !!apiKey,
  length: apiKey?.length || 0,
  starts_with: apiKey?.substring(0, 8) || 'undefined',
  ends_with: apiKey?.substring(apiKey.length - 4) || 'undefined',
  has_whitespace: apiKey?.includes('\n') || apiKey?.includes('\r') || apiKey?.includes(' ') || false,
  is_project_key: apiKey?.startsWith('sk-proj-'),
  has_org_id: !!orgId,
  has_project_id: !!projectId,
});

if (!apiKey) {
  console.error('❌ OPENAI_API_KEY is not set in environment variables!');
}

// Configure OpenAI client with optional project/org settings
const openaiConfig: any = {
  apiKey: apiKey,
};

if (orgId) {
  openaiConfig.organization = orgId;
}

if (projectId) {
  openaiConfig.project = projectId;
}

const openai = new OpenAI(openaiConfig);

export async function POST(request: NextRequest) {
  try {
    const { text, voice = 'alloy' } = await request.json();

    if (!text) {
      return NextResponse.json(
        { success: false, error: 'Text is required' },
        { status: 400 }
      );
    }

    // Generate speech using OpenAI TTS
    const mp3 = await openai.audio.speech.create({
      model: 'tts-1',
      voice: voice, // alloy, echo, fable, onyx, nova, shimmer
      input: text,
      speed: 1.0,
    });

    // Convert the response to a buffer
    const buffer = Buffer.from(await mp3.arrayBuffer());

    // Return audio as response
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': buffer.length.toString(),
      },
    });
  } catch (error: any) {
    console.error('❌ Error in TTS endpoint:', {
      message: error?.message,
      status: error?.status,
      code: error?.code,
      type: error?.type,
    });

    // Provide more specific error message
    let errorMessage = 'Failed to generate speech';
    if (error?.status === 401) {
      errorMessage = 'OpenAI API key is invalid or not properly configured. Please restart the dev server after updating .env.local';
    } else if (error?.message) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
