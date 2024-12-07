import { Module } from '@nestjs/common'
import { LocationsService } from './services/locations.service'
import { DrizzleModule } from 'src/drizzle/drizzle.module'
import { CacheModule } from 'src/cache/cache.module'
import { ImdbParserService } from './services/imdb-parser.service'
import { LocationsResolver } from './resolvers/locations.resolver'
import { TitleEntityService } from 'src/titles/services/title-entity.service'

@Module({
    imports: [DrizzleModule, CacheModule],
    providers: [
        LocationsService,
        ImdbParserService,
        LocationsResolver,
        TitleEntityService,
    ],
    exports: [LocationsService],
})
export class LocationsModule {}
