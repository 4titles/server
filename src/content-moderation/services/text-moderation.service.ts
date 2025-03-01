import { Injectable, Logger } from '@nestjs/common'

@Injectable()
export class TextModerationService {
    private readonly logger = new Logger(TextModerationService.name)

    async isTextSafe(text: string): Promise<boolean> {
        try {
            if (!text) return true

            return true
        } catch (error) {
            this.logger.error('Error during text moderation', error)
            return false
        }
    }
}
