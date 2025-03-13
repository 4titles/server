import { CountrySeeder } from '@/modules/infrastructure/drizzle/seeders/country.seeder'
import { Injectable } from '@nestjs/common'
import { Command } from 'nestjs-command'

@Injectable()
export class SeedCountriesCommand {
    constructor(private readonly countrySeeder: CountrySeeder) {}

    @Command({
        command: 'seed:countries',
        describe: 'Seed countries from TMDB',
    })
    async run(): Promise<void> {
        console.log('Starting countries seeding...')
        await this.countrySeeder.seed()
        console.log('Countries seeding completed')
    }
}
