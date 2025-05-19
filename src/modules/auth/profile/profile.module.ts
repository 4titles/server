import { CollectionModule } from '@/modules/content/collection/collection.module'
import { CommentModule } from '@/modules/content/comment/comment.module'
import { ContentModerationModule } from '@/modules/content/content-moderation/content-moderation.module'
import { Module } from '@nestjs/common'
import { FilmingLocationModule } from '../../content/title/modules/filming-location/filming-location.module'
import { ProfileResolver } from './profile.resolver'
import { ProfileService } from './profile.service'

@Module({
    imports: [
        ContentModerationModule,
        CollectionModule,
        FilmingLocationModule,
        CommentModule,
    ],
    providers: [ProfileResolver, ProfileService],
    exports: [ProfileService],
})
export class ProfileModule {}
