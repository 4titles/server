import { Module } from '@nestjs/common'
import { ContentModerationModule } from '../content-moderation/content-moderation.module'
import { NotificationService } from '../notification/notification.service'
import { FeedbackResolver } from './feedback.resolver'
import { FeedbackService } from './feedback.service'

@Module({
    imports: [ContentModerationModule],
    providers: [FeedbackResolver, FeedbackService, NotificationService],
    exports: [FeedbackService],
})
export class FeedbackModule {}
