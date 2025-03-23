import { BullModule } from '@nestjs/bullmq'
import { Module } from '@nestjs/common'
import { CountryModule } from './modules/country/country.module'
import { FilmingLocationModule } from './modules/filming-location/filming-location.module'
import { GenreModule } from './modules/genre/genre.module'
import { GeocodingModule } from './modules/geocoding/geocoding.module'
import { LanguageModule } from './modules/language/language.module'
import { TmdbModule } from './modules/tmdb/tmdb.module'
import { TitleCacheService } from './services/cache/title-cache.service'
import { TitleConfigCacheService } from './services/cache/title-config-cache.service'
import { TitleConfigSyncService } from './services/sync/title-config-sync.service'
import { TitleLocationSyncProcessor } from './services/sync/title-location-sync.processor'
import { TitleLocationSyncService } from './services/sync/title-location-sync.service'
import { TitleSyncQueueService } from './services/sync/title-sync-queue.service'
import { TitleSyncProcessor } from './services/sync/title-sync.processor'
import { TitleSyncService } from './services/sync/title-sync.service'
import { TitleService } from './services/title.service'
import { TitleChangeDetectorService } from './services/utils/title-change-detector.service'
import { TitleFetcherService } from './services/utils/title-fetcher.service'
import { TitleRelationService } from './services/utils/title-relation.service'
import { TitleTransformService } from './services/utils/title-transform.service'
import { TitleResolver } from './title.resolver'

@Module({
    imports: [
        CountryModule,
        GenreModule,
        GeocodingModule,
        LanguageModule,
        FilmingLocationModule,
        TmdbModule,
        BullModule.registerQueue(
            {
                name: 'title-sync',
            },
            {
                name: 'title-location-sync',
            },
        ),
    ],
    providers: [
        TitleService,
        TitleResolver,
        TitleSyncService,
        TitleConfigSyncService,
        TitleSyncProcessor,
        TitleLocationSyncProcessor,
        TitleTransformService,
        TitleRelationService,
        TitleFetcherService,
        TitleCacheService,
        TitleConfigCacheService,
        TitleSyncQueueService,
        TitleLocationSyncService,
        TitleChangeDetectorService,
    ],
    exports: [
        TitleService,
        TitleSyncService,
        TitleConfigSyncService,
        TitleLocationSyncService,
    ],
})
export class TitleModule {}
