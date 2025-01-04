import { Module } from '@nestjs/common'
import { TitlesService } from './services/titles.service'
import { DrizzleModule } from '@/modules/drizzle/drizzle.module'
import { CacheModule } from '@/modules/cache/cache.module'
import { LocationsModule } from '@/modules/locations/locations.module'
import { TitleEntityService } from './services/entity/title-entity.service'
import { TmdbModule } from '../tmdb/tmdb.module'
import * as resolvers from './resolvers'
import * as services from './services'
import * as entityServices from './services/entity'
import * as mappers from './mappers'

@Module({
    imports: [CacheModule, TmdbModule, DrizzleModule, LocationsModule],
    providers: [
        // services
        ...Object.values(services),

        // entity services
        ...Object.values(entityServices),

        // resolvers
        ...Object.values(resolvers),

        // mappers
        ...Object.values(mappers),
    ],
    exports: [TitlesService, TitleEntityService],
})
export class TitlesModule {}
