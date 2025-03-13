import { Module } from '@nestjs/common'
import { ContentModerationService } from './services/content-moderation.service'
import { ImageModerationService } from './services/image-moderation.service'
import { TextModerationService } from './services/text-moderation.service'

@Module({
    providers: [
        ContentModerationService,
        ImageModerationService,
        TextModerationService,
    ],
    exports: [
        ContentModerationService,
        ImageModerationService,
        TextModerationService,
    ],
})
export class ContentModerationModule {}
