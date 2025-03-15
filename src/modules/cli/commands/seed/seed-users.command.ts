import { UserSeeder } from '@/modules/infrastructure/drizzle/seeders/user.seeder'
import { Injectable } from '@nestjs/common'
import { Command, Option } from 'nestjs-command'

@Injectable()
export class SeedUsersCommand {
    constructor(private readonly userSeeder: UserSeeder) {}

    @Command({
        command: 'seed:users',
        describe: 'Seed users to the database',
    })
    async run(
        @Option({
            name: 'count',
            describe: 'Number of users to seed',
            type: 'number',
            default: 10,
        })
        count: number,

        @Option({
            name: 'password',
            describe: 'Password for seeded users',
            type: 'string',
            required: false,
        })
        password?: string,

        @Option({
            name: 'verified',
            describe: 'Percentage of users with verified email (0-100)',
            type: 'number',
            default: 80,
        })
        verified?: number,

        @Option({
            name: 'deactivated',
            describe: 'Percentage of deactivated users (0-100)',
            type: 'number',
            default: 10,
        })
        deactivated?: number,

        @Option({
            name: 'telegram',
            describe: 'Percentage of users with Telegram (0-100)',
            type: 'number',
            default: 60,
        })
        telegram?: number,

        @Option({
            name: 'totp',
            describe: 'Percentage of users with TOTP enabled (0-100)',
            type: 'number',
            default: 30,
        })
        totp?: number,

        @Option({
            name: 'adminPercentage',
            describe: 'Percentage of users with ADMIN role (0-100)',
            type: 'number',
            default: 5,
        })
        admin?: number,

        @Option({
            name: 'moderatorPercentage',
            describe: 'Percentage of users with MODERATOR role (0-100)',
            type: 'number',
            default: 10,
        })
        moderator?: number,

        @Option({
            name: 'test-users',
            describe: 'Number of test users to create',
            type: 'number',
            default: 0,
        })
        testUsers?: number,

        @Option({
            name: 'cleanup',
            describe: 'Clean up seeded users',
            type: 'boolean',
            default: false,
        })
        cleanup?: boolean,
    ): Promise<void> {
        try {
            if (cleanup) {
                const deleteCount = await this.userSeeder.cleanup(false)
                console.log(`Successfully cleaned up ${deleteCount} users`)
                return
            }

            if (testUsers > 0) {
                const testUserIds =
                    await this.userSeeder.seedTestUsers(testUsers)
                console.log(
                    `Successfully seeded ${testUserIds.length} test users`,
                )
            }

            if (count > 0) {
                const userIds = await this.userSeeder.seed(count, {
                    password,
                    verifiedEmailPercentage: verified,
                    deactivatedPercentage: deactivated,
                    withTelegramPercentage: telegram,
                    withTotpPercentage: totp,
                    adminPercentage: admin,
                    moderatorPercentage: moderator,
                })

                console.log(`Successfully seeded ${userIds.length} users`)
            }
        } catch (error) {
            console.error('Error seeding users:', error.message)
            process.exit(1)
        }
    }

    @Command({
        command: 'cleanup:users',
        describe: 'Clean up seeded users',
    })
    async cleanup(
        @Option({
            name: 'keep-test',
            describe: 'Keep test users',
            type: 'boolean',
            default: true,
        })
        keepTest: boolean,
    ): Promise<void> {
        try {
            const deleteCount = await this.userSeeder.cleanup(keepTest)
            console.log(`Successfully cleaned up ${deleteCount} users`)
        } catch (error) {
            console.error('Error cleaning up users:', error.message)
            process.exit(1)
        }
    }
}
