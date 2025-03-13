import { Module } from '@nestjs/common'
import { NotificationService } from '../../infrastructure/notification/notification.service'
import { ContentModerationModule } from '../content-moderation/content-moderation.module'
import { FeedbackResolver } from './feedback.resolver'
import { FeedbackService } from './feedback.service'

@Module({
    imports: [ContentModerationModule],
    providers: [FeedbackResolver, FeedbackService, NotificationService],
    exports: [FeedbackService],
})
export class FeedbackModule {}
