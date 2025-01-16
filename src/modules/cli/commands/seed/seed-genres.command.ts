import { Injectable } from '@nestjs/common'
import { GenreSeeder } from '../../../drizzle/seeders/genre.seeder'
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
