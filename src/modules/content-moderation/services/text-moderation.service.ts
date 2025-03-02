import { Profanity } from '@2toad/profanity'
import { Injectable, Logger } from '@nestjs/common'

@Injectable()
export class TextModerationService {
    private readonly logger = new Logger(TextModerationService.name)
    private readonly profanity: Profanity

    constructor() {
        this.profanity = new Profanity({
            languages: ['ru', 'en', 'fr'],
            wholeWord: false,
            grawlixChar: '*',
        })
    }

    async isTextSafe(text: string): Promise<boolean> {
        try {
            if (!text) return true

            return !this.profanity.exists(text)
        } catch (error) {
            this.logger.error('Error occured during text moderation', error)
            return false
        }
    }

    async moderateText(text: string): Promise<string> {
        try {
            if (!text) return text
            return this.profanity.censor(text)
        } catch (error) {
            this.logger.error('Error occured during text moderation', error)
            return text
        }
    }
}
