import { forwardRef, Module } from '@nestjs/common'
import { TitleModule } from '../title/title.module'
import { CommentResolver } from './comment.resolver'
import { CommentCacheService } from './services/comment-cache.service'
import { CommentService } from './services/comment.service'

@Module({
    imports: [forwardRef(() => TitleModule)],
    providers: [CommentResolver, CommentService, CommentCacheService],
    exports: [CommentService],
})
export class CommentModule {}
