import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { OpenAI } from 'openai'
import { LlmCompletionOptions } from './ai.service'

@Injectable()
export class DeepseekService {
    private readonly logger = new Logger(DeepseekService.name)
    private readonly client: OpenAI
    private readonly defaultModel: string

    constructor(private readonly configService: ConfigService) {
        const apiKey = this.configService.get<string>('OPEN_ROUTER_API_KEY')
        if (!apiKey) {
            this.logger.warn('DEEPSEEK_API_KEY is not set')
        }

        this.client = new OpenAI({
            apiKey,
            baseURL: 'https://openrouter.ai/api/v1',
        })

        this.defaultModel = this.configService.get<string>(
            'OPEN_ROUTER_DEEEPSEEK_MODEL',
            'deepseek/deepseek-chat-v3-0324:free',
        )
    }

    async completion(
        prompt: string,
        options?: LlmCompletionOptions,
    ): Promise<string> {
        try {
            this.logger.debug(
                `Sending completion request with model: ${this.defaultModel}`,
            )

            const response = await this.client.chat.completions.create({
                model: this.defaultModel,
                messages: [{ role: 'user', content: prompt }],
                temperature: options?.temperature ?? 0.7,
                max_tokens: options?.maxTokens ?? 1024,
                stream: false,
            })

            return response.choices[0]?.message?.content || ''
        } catch (error) {
            this.logger.error(
                `Deepseek API error: ${error.message}`,
                error.stack,
            )
            throw error
        }
    }
}
