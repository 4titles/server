import { GenreSeeder } from '@/modules/infrastructure/drizzle/seeders/genre.seeder'
import { Injectable } from '@nestjs/common'
import { Command } from 'nestjs-command'

@Injectable()
export class SeedGenresCommand {
    constructor(private readonly genreSeeder: GenreSeeder) {}

    @Command({
        command: 'seed:genres',
        describe: 'Seed genres from TMDB',
    })
    async run(): Promise<void> {
        console.log('Starting genres seeding...')
        await this.genreSeeder.seed()
        console.log('Genres seeding completed')
    }
}
