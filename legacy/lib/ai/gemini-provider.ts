/**
 * Google Gemini AI Provider
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIProvider, AIMessage, GenerateOptions, AIProviderError } from './providers';

export class GeminiProvider implements AIProvider {
  name = 'Gemini';
  private client?: GoogleGenerativeAI;

  constructor() {
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    if (apiKey) {
      this.client = new GoogleGenerativeAI(apiKey);
    }
  }

  isConfigured(): boolean {
    return !!this.client;
  }

  async generateResponse(messages: AIMessage[], options?: GenerateOptions): Promise<string> {
    if (!this.client) {
      throw new AIProviderError(this.name, 'Gemini API key not configured');
    }

    try {
      // Gemini uses gemini-1.5-pro or gemini-1.5-flash
      const model = this.client.getGenerativeModel({
        model: 'gemini-1.5-flash', // Fast and free tier available
        generationConfig: {
          temperature: options?.temperature ?? 0.8,
          maxOutputTokens: options?.maxTokens ?? 200,
          ...(options?.jsonMode ? { responseMimeType: 'application/json' } : {}),
        },
      });

      // Convert messages to Gemini format
      const systemMessage = messages.find(m => m.role === 'system');
      const conversationMessages = messages.filter(m => m.role !== 'system');

      // Build history (all messages except the last user message)
      const history = conversationMessages.slice(0, -1).map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }],
      }));

      // Last message should be the current user message
      const lastMessage = conversationMessages[conversationMessages.length - 1];
      if (!lastMessage || lastMessage.role !== 'user') {
        throw new AIProviderError(this.name, 'Last message must be from user');
      }

      // Start chat with system instruction and history
      const chat = model.startChat({
        history,
        ...(systemMessage ? { systemInstruction: systemMessage.content } : {}),
      });

      // Send the user message
      const result = await chat.sendMessage(lastMessage.content);
      const response = result.response;
      const text = response.text();

      if (!text) {
        throw new AIProviderError(this.name, 'Empty response received');
      }

      return text;
    } catch (error: any) {
      // Handle rate limiting
      if (error?.message?.includes('429') || error?.message?.includes('quota')) {
        throw new AIProviderError(this.name, 'Rate limit exceeded or quota exhausted', error);
      }

      // Handle authentication errors
      if (error?.message?.includes('401') || error?.message?.includes('API key')) {
        throw new AIProviderError(this.name, 'Invalid API key', error);
      }

      throw new AIProviderError(
        this.name,
        error?.message || 'Unknown error',
        error
      );
    }
  }
}
