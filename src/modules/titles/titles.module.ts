import { Module } from '@nestjs/common'
import { DrizzleModule } from '@/modules/drizzle/drizzle.module'
import { CacheModule } from '@/modules/cache/cache.module'
import { LocationsModule } from '@/modules/locations/locations.module'
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
    exports: [services.TitlesService, services.TitleSyncManagerService],
})
export class TitlesModule {}
