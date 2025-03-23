import { TitleConfigSeeder } from '@/modules/infrastructure/drizzle/seeders'
import { Injectable } from '@nestjs/common'
import { Command } from 'nestjs-command'

@Injectable()
export class SeedTitleConfigCommand {
    constructor(private readonly titleConfigSeeder: TitleConfigSeeder) {}

    @Command({
        command: 'seed:title-config',
        describe: 'Seed config data for titles',
    })
    async run(): Promise<void> {
        await this.titleConfigSeeder.seed()
    }
}
