import { CacheService } from '@/modules/infrastructure/cache/cache.service'
import { Injectable, Logger } from '@nestjs/common'
import { CommentFilterInput } from '../inputs/comment-filter.input'
import { Comment } from '../models/comment.model'

@Injectable()
export class CommentCacheService {
    private readonly logger = new Logger(CommentCacheService.name)
    private readonly CACHE_TTL = 60 * 60 * 24 * 3

    constructor(private readonly cacheService: CacheService) {}

    getCommentsCacheKey(input: CommentFilterInput): string {
        const { commentableType, commentableId, take, skip, sortBy } = input
        return `comments:${commentableType}:${commentableId}:${take}:${skip}:${sortBy}`
    }

    async getComments(input: CommentFilterInput): Promise<string | null> {
        const key = this.getCommentsCacheKey(input)
        try {
            return await this.cacheService.get<string>(key)
        } catch (error) {
            this.logger.error(
                `Error getting comments from cache: ${error.message}`,
            )
            return null
        }
    }

    async storeComments(
        input: CommentFilterInput,
        comments: Comment[],
    ): Promise<void> {
        const key = this.getCommentsCacheKey(input)
        try {
            await this.cacheService.set(
                key,
                JSON.stringify(comments),
                this.CACHE_TTL,
            )
        } catch (error) {
            this.logger.error(
                `Error storing comments in cache: ${error.message}`,
            )
        }
    }

    async invalidateCommentsCache(
        commentableType: string,
        commentableId: string,
    ): Promise<void> {
        try {
            const pattern = `comments:${commentableType}:${commentableId}:*`
            const client = await this.cacheService.getClient()
            const keys = await client.keys(pattern)

            if (keys.length > 0) {
                keys.map(async (k) => await this.cacheService.del(k))
                this.logger.debug(
                    `Invalidated ${keys.length} cache entries for ${commentableType}:${commentableId}`,
                )
            }
        } catch (error) {
            this.logger.error(
                `Error invalidating comments cache: ${error.message}`,
            )
        }
    }
}
