import { Injectable } from '@nestjs/common'
import { GenreSeeder } from './genre.seeder'
import { CountrySeeder } from './country.seeder'
import { LanguageSeeder } from './language.seeder'

@Injectable()
export class DatabaseSeeder {
    constructor(
        private readonly genreSeeder: GenreSeeder,
        private readonly countrySeeder: CountrySeeder,
        private readonly languageSeeder: LanguageSeeder,
    ) {}

    async seedAll(): Promise<void> {
        await this.genreSeeder.seed()
        await this.countrySeeder.seed()
        await this.languageSeeder.seed()
    }
}
