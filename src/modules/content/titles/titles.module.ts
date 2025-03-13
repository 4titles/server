import { LocationsModule } from '@/modules/content/locations/locations.module'
import { Module } from '@nestjs/common'
import { TmdbModule } from '../../infrastructure/tmdb/tmdb.module'
import * as mappers from './mappers'
import * as resolvers from './resolvers'
import * as services from './services'
import * as entityServices from './services/entity'
@Module({
    imports: [TmdbModule, LocationsModule],
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
