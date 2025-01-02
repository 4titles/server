import { Injectable } from '@nestjs/common'
import { GenreSeeder } from './genre.seeder'
import { CountrySeeder } from './country.seeder'

@Injectable()
export class DatabaseSeeder {
    constructor(
        private readonly genreSeeder: GenreSeeder,
        private readonly countrySeeder: CountrySeeder,
    ) {}

    async seedAll(): Promise<void> {
        await this.genreSeeder.seed()
        await this.countrySeeder.seed()
    }
}
