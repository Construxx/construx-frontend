import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';

/** Thin wrapper around the Anthropic SDK. Returns null when no key is set or the call fails. */
@Injectable()
export class AnthropicClient {
  private readonly logger = new Logger(AnthropicClient.name);
  private readonly client: Anthropic | null;
  readonly model: string;

  constructor(config: ConfigService) {
    const key = config.get<string>('ANTHROPIC_API_KEY');
    this.client = key ? new Anthropic({ apiKey: key }) : null;
    this.model = config.get<string>('ANTHROPIC_MODEL') ?? 'claude-sonnet-5';
    if (!this.client) this.logger.warn('ANTHROPIC_API_KEY not set: AI endpoints will use rule-based fallbacks.');
  }

  get enabled() { return this.client !== null; }

  async complete(system: string, user: string, maxTokens = 1500): Promise<string | null> {
    if (!this.client) return null;
    try {
      const res = await this.client.messages.create({
        model: this.model,
        max_tokens: maxTokens,
        system,
        messages: [{ role: 'user', content: user }],
      });
      return res.content.map((b) => (b.type === 'text' ? b.text : '')).join('').trim();
    } catch (err) {
      this.logger.error(`Anthropic call failed: ${(err as Error).message}`);
      return null;
    }
  }
}
