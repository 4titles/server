import { FollowSeeder } from '@/modules/infrastructure/drizzle/seeders/follow.seeder'
import { Injectable } from '@nestjs/common'
import { Command, Option } from 'nestjs-command'

@Injectable()
export class SeedFollowCommand {
    constructor(private readonly followSeeder: FollowSeeder) {}

    @Command({
        command: 'seed:follows',
        describe: 'Seed follows between users',
    })
    async run(
        @Option({
            name: 'min',
            describe: 'Minimum follows per user',
            type: 'number',
            default: 0,
        })
        min: number,

        @Option({
            name: 'max',
            describe: 'Maximum follows per user',
            type: 'number',
            default: 10,
        })
        max: number,

        @Option({
            name: 'probability',
            describe: 'Probability of following (0-1)',
            type: 'number',
            default: 0.3,
        })
        probability: number,

        @Option({
            name: 'clean',
            describe: 'Clean existing follows before seeding',
            type: 'boolean',
            default: false,
        })
        clean: boolean,

        @Option({
            name: 'test',
            describe: 'Seed test follows for test users',
            type: 'boolean',
            default: false,
        })
        test: boolean,
    ): Promise<void> {
        console.log('Starting follows seeding...')

        if (clean) {
            const deletedCount = await this.followSeeder.cleanup()
            console.log(`Cleaned up ${deletedCount} existing follows`)
        }

        if (test) {
            const testFollowsCount = await this.followSeeder.seedTestFollows()
            console.log(`Created ${testFollowsCount} test follows`)
        } else {
            const followsCount = await this.followSeeder.seed({
                minFollowsPerUser: min,
                maxFollowsPerUser: max,
                followProbability: probability,
            })
            console.log(`Created ${followsCount} follows`)
        }

        console.log('Follows seeding completed')
    }
}
