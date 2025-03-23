import { Module } from '@nestjs/common'
import { TmdbModule } from '../tmdb/tmdb.module'
import { CountryResolver } from './country.resolver'
import { CountryService } from './country.service'

@Module({
    imports: [TmdbModule],
    providers: [CountryService, CountryResolver],
    exports: [CountryService],
})
export class CountryModule {}
