import { Injectable, Logger } from '@nestjs/common'
import { DeepseekService } from './deepseek.service'

export interface LlmCompletionOptions {
    temperature?: number
    maxTokens?: number
    language?: string
}

@Injectable()
export class AiService {
    private readonly logger = new Logger(AiService.name)

    constructor(private readonly deepseekService: DeepseekService) {}

    async completion(
        prompt: string,
        options?: LlmCompletionOptions,
    ): Promise<string> {
        try {
            return await this.deepseekService.completion(prompt, options)
        } catch (error) {
            this.logger.error(
                `Failed to get completion for prompt: ${error.message}`,
                error.stack,
            )
            throw error
        }
    }
}
