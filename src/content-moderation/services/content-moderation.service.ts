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
            const isImageSafe =
                await this.imageModerationService.isImageSafe(image)
            if (!isImageSafe) return false
        }

        if (text) {
            const isTextSafe = await this.textModerationService.isTextSafe(text)
            if (!isTextSafe) return false
        }

        return true
    }
}
