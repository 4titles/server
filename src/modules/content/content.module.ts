import { Module } from '@nestjs/common'
import { ContentModerationModule } from './content-moderation/content-moderation.module'
import { FeedbackModule } from './feedback/feedback.module'
import { FollowModule } from './follow/follow.module'
import { LocationsModule } from './locations/locations.module'
import { TitlesModule } from './titles/titles.module'

@Module({
    imports: [
        TitlesModule,
        LocationsModule,
        FeedbackModule,
        FollowModule,
        ContentModerationModule,
    ],
})
export class ContentModule {}
