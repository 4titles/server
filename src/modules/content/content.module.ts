import { Module } from '@nestjs/common'
import { ContentModerationModule } from './content-moderation/content-moderation.module'
import { FavoriteModule } from './favorite/favorite.module'
import { FeedbackModule } from './feedback/feedback.module'
import { FollowModule } from './follow/follow.module'
import { TitleModule } from './title/title.module'

@Module({
    imports: [
        TitleModule,
        FeedbackModule,
        FollowModule,
        ContentModerationModule,
        FavoriteModule,
    ],
})
export class ContentModule {}
