import { Injectable } from '@nestjs/common'
import { Command } from 'nestjs-command'
import { LanguageSeeder } from '@/modules/drizzle/seeders'

@Injectable()
export class SeedLanguagesCommand {
    constructor(private readonly languageSeeder: LanguageSeeder) {}

    @Command({
        command: 'seed:languages',
        describe: 'Seed languages from TMDB',
    })
    async run(): Promise<void> {
        console.log('Starting languages seeding...')
        await this.languageSeeder.seed()
        console.log('Languages seeding completed')
    }
}
