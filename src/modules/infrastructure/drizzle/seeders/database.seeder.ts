import { Injectable } from '@nestjs/common'
import { CountrySeeder } from './country.seeder'
import { GenreSeeder } from './genre.seeder'
import { LanguageSeeder } from './language.seeder'
import { RolesPermissionsSeeder } from './roles-permissions.seeder'

@Injectable()
export class DatabaseSeeder {
    constructor(
        private readonly genreSeeder: GenreSeeder,
        private readonly countrySeeder: CountrySeeder,
        private readonly languageSeeder: LanguageSeeder,
        private readonly rolesPermissionsSeeder: RolesPermissionsSeeder,
    ) {}

    async seedAll(): Promise<void> {
        await this.genreSeeder.seed()
        await this.countrySeeder.seed()
        await this.languageSeeder.seed()
        await this.rolesPermissionsSeeder.seed()
    }
}
