import { S3Module } from '@/modules/infrastructure/s3/s3.module'
import { forwardRef, Module } from '@nestjs/common'
import { CommentModule } from '../comment/comment.module'
import { ContentModerationModule } from '../content-moderation/content-moderation.module'
import { FavoriteModule } from '../favorite/favorite.module'
import { FilmingLocationModule } from '../title/modules/filming-location/filming-location.module'
import { TitleModule } from '../title/title.module'
import { CollectionResolver } from './collection.resolver'
import { CollectionService } from './collection.service'

@Module({
    imports: [
        ContentModerationModule,
        forwardRef(() => FavoriteModule),
        forwardRef(() => TitleModule),
        FilmingLocationModule,
        CommentModule,
        S3Module,
    ],
    providers: [CollectionResolver, CollectionService],
    exports: [CollectionService],
})
export class CollectionModule {}
