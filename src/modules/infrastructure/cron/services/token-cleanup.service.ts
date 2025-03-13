import { DRIZZLE } from '@/modules/infrastructure/drizzle/drizzle.module'
import { tokens } from '@/modules/infrastructure/drizzle/schema/tokens.schema'
import { DrizzleDB } from '@/modules/infrastructure/drizzle/types/drizzle'
import { Inject, Injectable, Logger } from '@nestjs/common'
import { lte } from 'drizzle-orm'

@Injectable()
export class TokenCleanupService {
    private readonly logger = new Logger(TokenCleanupService.name)

    constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

    async cleanupExpiredTokens() {
        try {
            const result = await this.db
                .delete(tokens)
                .where(lte(tokens.expiresAt, new Date()))
                .returning({ id: tokens.id })

            return {
                deletedCount: result.length,
            }
        } catch (error) {
            this.logger.error(
                `Expired tokens cleanup job failed: ${error.message}`,
                error.stack,
            )
            throw error
        }
    }
}
