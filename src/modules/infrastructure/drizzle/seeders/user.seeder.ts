import { faker } from '@faker-js/faker'
import { Inject, Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { hash } from 'argon2'
import { like, not } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'
import { DRIZZLE } from '../drizzle.module'
import { notificationSettings } from '../schema/notifications.schema'
import { users } from '../schema/users.schema'
import { DrizzleDB } from '../types/drizzle'

@Injectable()
export class UserSeeder {
    private readonly logger = new Logger(UserSeeder.name)
    private readonly defaultPassword = 'Password123!'

    constructor(
        @Inject(DRIZZLE) private readonly db: DrizzleDB,
        private readonly configService: ConfigService,
    ) {}

    async seed(
        count: number = 10,
        options: {
            password?: string
            verifiedEmailPercentage?: number
            deactivatedPercentage?: number
            withTelegramPercentage?: number
            withTotpPercentage?: number
        } = {},
    ): Promise<string[]> {
        this.logger.log(`Starting to seed ${count} users`)

        const hashedPassword = await hash(
            options.password || this.defaultPassword,
        )

        const userBatch = []
        const notificationSettingsBatch = []
        const createdUserIds = []

        const verifiedEmailCount = Math.floor(
            ((options.verifiedEmailPercentage ?? 80) * count) / 100,
        )
        const deactivatedCount = Math.floor(
            ((options.deactivatedPercentage ?? 10) * count) / 100,
        )
        const withTelegramCount = Math.floor(
            ((options.withTelegramPercentage ?? 60) * count) / 100,
        )
        const withTotpCount = Math.floor(
            ((options.withTotpPercentage ?? 30) * count) / 100,
        )

        for (let i = 0; i < count; i++) {
            const userId = uuidv4()
            createdUserIds.push(userId)

            const username = faker.internet.username().toLowerCase()
            const email = faker.internet.email().toLowerCase()

            const isEmailVerified = i < verifiedEmailCount
            const isDeactivated = i < deactivatedCount
            const hasTelegram = i < withTelegramCount
            const hasTotp = i < withTotpCount

            userBatch.push({
                id: userId,
                email,
                password: hashedPassword,
                username,
                displayName: faker.person.fullName(),
                avatar: Math.random() > 0.7 ? faker.image.avatarGitHub() : null,
                bio: Math.random() > 0.5 ? faker.lorem.paragraph(2) : null,
                telegramId: hasTelegram ? faker.string.numeric(10) : null,
                isVerified: isEmailVerified,
                isTotpEnabled: hasTotp,
                totpSecret: hasTotp ? faker.string.alphanumeric(32) : null,
                isDeactivated,
                deactivatedAt: isDeactivated
                    ? faker.date.recent({ days: 5 })
                    : null,
                emailVerifiedAt: isEmailVerified ? faker.date.past() : null,
                createdAt: faker.date.past(),
                updatedAt: faker.date.recent(),
            })

            notificationSettingsBatch.push({
                id: uuidv4(),
                userId,
                isSiteNotificationsEnabled: Math.random() > 0.2,
                isTelegramNotificationsEnabled:
                    hasTelegram && Math.random() > 0.3,
            })

            if (userBatch.length >= 1000 || i === count - 1) {
                await this._insertBatch(userBatch, notificationSettingsBatch)
                userBatch.length = 0
                notificationSettingsBatch.length = 0
                this.logger.log(
                    `Seeded batch of users (total progress: ${i + 1}/${count})`,
                )
            }
        }

        this.logger.log(`Successfully seeded ${count} users`)
        return createdUserIds
    }

    async seedTestUsers(count = 5): Promise<string[]> {
        const testUsers = []
        const testNotificationSettings = []
        const createdUserIds = []

        const hashedPassword = await hash(this.defaultPassword)

        for (let i = 0; i < count; i++) {
            const userId = uuidv4()
            createdUserIds.push(userId)

            testUsers.push({
                id: userId,
                email: `test${i + 1}@example.com`,
                password: hashedPassword,
                username: `testuser${i + 1}`,
                displayName: `Test User ${i + 1}`,
                avatar: null,
                bio: `This is a test user ${i + 1}`,
                telegramId: i % 2 === 0 ? `1234567${i}` : null,
                isVerified: true,
                isTotpEnabled: i % 3 === 0,
                totpSecret: i % 3 === 0 ? faker.string.alphanumeric(32) : null,
                isDeactivated: false,
                emailVerifiedAt: new Date(),
            })

            testNotificationSettings.push({
                id: uuidv4(),
                userId,
                isSiteNotificationsEnabled: true,
                isTelegramNotificationsEnabled: i % 2 === 0,
            })
        }

        await this._insertBatch(testUsers, testNotificationSettings)
        this.logger.log(`Successfully seeded ${count} test users`)

        return createdUserIds
    }

    async cleanup(keepTestUsers = false): Promise<number> {
        try {
            let deleteQuery: any = this.db.delete(users)

            if (keepTestUsers) {
                deleteQuery = deleteQuery.where(
                    not(like(users.email, 'test%@example.com')),
                )
            }

            const result = await deleteQuery

            const deletedCount = result.rowCount || 0

            this.logger.log(`Cleaned up ${deletedCount} seeded users`)
            return deletedCount
        } catch (error) {
            this.logger.error(
                `Failed to clean up seeded users: ${error.message}`,
                error.stack,
            )
            throw error
        }
    }

    private async _insertBatch(userBatch, notificationSettingsBatch) {
        try {
            await this.db.transaction(async (tx) => {
                await tx.insert(users).values(userBatch)
                await tx
                    .insert(notificationSettings)
                    .values(notificationSettingsBatch)
            })
        } catch (error) {
            this.logger.error(
                `Failed to insert user batch: ${error.message}`,
                error.stack,
            )
            throw error
        }
    }
}
