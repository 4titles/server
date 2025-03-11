import { Module } from '@nestjs/common'
import { NotificationService } from '../notification/notification.service'
import { FeedbackResolver } from './feedback.resolver'
import { FeedbackService } from './feedback.service'

@Module({
    providers: [FeedbackResolver, FeedbackService, NotificationService],
    exports: [FeedbackService],
})
export class FeedbackModule {}
