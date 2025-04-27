import { HttpModule } from '@nestjs/axios'
import { Module } from '@nestjs/common'
import { TmdbModule } from '../tmdb/tmdb.module'
import { CountryFlagService } from './country-flag.service'
import { CountryResolver } from './country.resolver'
import { CountryService } from './country.service'

@Module({
    imports: [
        TmdbModule,
        HttpModule.register({
            timeout: 10000,
            maxRedirects: 5,
        }),
    ],
    providers: [CountryService, CountryResolver, CountryFlagService],
    exports: [CountryService],
})
export class CountryModule {}
