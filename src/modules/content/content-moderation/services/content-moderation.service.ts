import { Injectable } from '@nestjs/common'
import { ImageModerationService } from './image-moderation.service'
import { TextModerationService } from './text-moderation.service'

@Injectable()
export class ContentModerationService {
    constructor(
        private readonly imageModerationService: ImageModerationService,
        private readonly textModerationService: TextModerationService,
    ) {}

    async validateContent(options: {
        image?: Buffer
        text?: string
    }): Promise<boolean> {
        const { image, text } = options

        if (image) {
            return await this.imageModerationService.isImageSafe(image)
        }

        if (text) {
            return await this.textModerationService.isTextSafe(text)
        }

        return true
    }

    async moderateTextField(text: string): Promise<string> {
        return this.textModerationService.moderateText(text)
    }
}
