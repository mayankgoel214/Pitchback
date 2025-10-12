/**
 * AI Provider Abstraction Layer
 * Supports multiple AI providers with automatic fallback
 */

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIProvider {
  name: string;
  generateResponse(messages: AIMessage[], options?: GenerateOptions): Promise<string>;
  isConfigured(): boolean;
}

export interface GenerateOptions {
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
}

export class AIProviderError extends Error {
  constructor(
    public providerName: string,
    message: string,
    public originalError?: any
  ) {
    super(`[${providerName}] ${message}`);
    this.name = 'AIProviderError';
  }
}

/**
 * AI Provider Manager with automatic fallback
 */
export class AIProviderManager {
  private providers: AIProvider[] = [];
  private preferredProvider?: string;

  constructor(providers: AIProvider[], preferredProvider?: string) {
    this.providers = providers;
    this.preferredProvider = preferredProvider;
  }

  /**
   * Generate a response using the preferred provider, falling back to others if needed
   */
  async generateResponse(
    messages: AIMessage[],
    options?: GenerateOptions
  ): Promise<{ response: string; usedProvider: string }> {
    const errors: Array<{ provider: string; error: any }> = [];

    // Get ordered list of providers to try
    const providersToTry = this.getOrderedProviders();

    for (const provider of providersToTry) {
      if (!provider.isConfigured()) {
        console.warn(`[${provider.name}] Skipping - not configured`);
        continue;
      }

      try {
        console.log(`[${provider.name}] Attempting to generate response...`);
        const response = await provider.generateResponse(messages, options);
        console.log(`[${provider.name}] Successfully generated response`);
        return { response, usedProvider: provider.name };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`[${provider.name}] Failed: ${errorMessage}`);
        errors.push({ provider: provider.name, error });
        // Continue to next provider
      }
    }

    // All providers failed
    const errorSummary = errors
      .map(({ provider, error }) => `${provider}: ${error.message || error}`)
      .join('; ');
    throw new Error(
      `All AI providers failed. Errors: ${errorSummary}`
    );
  }

  /**
   * Get providers in order of preference
   */
  private getOrderedProviders(): AIProvider[] {
    if (!this.preferredProvider) {
      return this.providers;
    }

    const preferred = this.providers.find(p => p.name === this.preferredProvider);
    const others = this.providers.filter(p => p.name !== this.preferredProvider);

    return preferred ? [preferred, ...others] : this.providers;
  }

  /**
   * Get list of configured providers
   */
  getConfiguredProviders(): string[] {
    return this.providers
      .filter(p => p.isConfigured())
      .map(p => p.name);
  }
}
