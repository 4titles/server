import { forwardRef, Module } from '@nestjs/common'
import { ContentModerationModule } from '../content-moderation/content-moderation.module'
import { TitleModule } from '../title/title.module'
import { CommentResolver } from './comment.resolver'
import { CommentCacheService } from './services/comment-cache.service'
import { CommentService } from './services/comment.service'

@Module({
    imports: [forwardRef(() => TitleModule), ContentModerationModule],
    providers: [CommentResolver, CommentService, CommentCacheService],
    exports: [CommentService],
})
export class CommentModule {}
