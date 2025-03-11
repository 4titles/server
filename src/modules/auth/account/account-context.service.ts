import { User } from '@/modules/auth/account/models/user.model'
import { Injectable, Logger } from '@nestjs/common'
import { AccountService } from './account.service'

@Injectable()
export class AccountContextService {
    private readonly logger = new Logger(AccountContextService.name)
    private readonly userCache = new Map<
        string,
        { user: User; timestamp: number }
    >()
    private readonly USER_CACHE_TTL = 5 * 60 * 1000

    constructor(private readonly accountService: AccountService) {}

    async getUserByChatId(chatId: string): Promise<User | null> {
        const cacheKey = `telegram:${chatId}`
        const cachedUser = this.userCache.get(cacheKey)

        if (
            cachedUser &&
            Date.now() - cachedUser.timestamp < this.USER_CACHE_TTL
        ) {
            return cachedUser.user
        }

        try {
            const user = await this.accountService.findByTelegramId(chatId)

            if (user) {
                this.userCache.set(cacheKey, {
                    user,
                    timestamp: Date.now(),
                })
            }

            return user
        } catch (error) {
            this.logger.error(
                `Error fetching user by chatId ${chatId}: ${error.message}`,
            )
            return null
        }
    }

    async getUserById(userId: string): Promise<User | null> {
        const cacheKey = `id:${userId}`
        const cachedUser = this.userCache.get(cacheKey)

        if (
            cachedUser &&
            Date.now() - cachedUser.timestamp < this.USER_CACHE_TTL
        ) {
            return cachedUser.user
        }

        try {
            const user = await this.accountService.findById(userId)

            if (user) {
                this.userCache.set(cacheKey, {
                    user,
                    timestamp: Date.now(),
                })
            }

            return user
        } catch (error) {
            this.logger.error(
                `Error fetching user by ID ${userId}: ${error.message}`,
            )
            return null
        }
    }

    clearUserCache(userId: string, telegramId?: string): void {
        this.userCache.delete(`id:${userId}`)

        if (telegramId) {
            this.userCache.delete(`telegram:${telegramId}`)
        }
    }
}
