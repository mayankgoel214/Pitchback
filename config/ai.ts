// AI configuration
export const AI_CONFIG = {
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    models: {
      conversation: 'gpt-4-turbo-preview',
      evaluation: 'gpt-4-turbo-preview',
      transcription: 'whisper-1',
      tts: 'tts-1',
    },
  },
  elevenlabs: {
    apiKey: process.env.ELEVENLABS_API_KEY || '',
  },
};
