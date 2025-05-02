import { AiModule } from '@/modules/infrastructure/ai/ai.module'
import { BullModule } from '@nestjs/bullmq'
import { Module } from '@nestjs/common'
import { TitleRelationsConfigService } from './config/title-relations.config'
import { TitleSupportedLanguagesConfig } from './config/title-supported-languages.config'
import { CountryModule } from './modules/country/country.module'
import { TitleElasticsearchModule } from './modules/elasticsearch/title-elasticsearch.module'
import { FilmingLocationModule } from './modules/filming-location/filming-location.module'
import { GenreModule } from './modules/genre/genre.module'
import { GeocodingModule } from './modules/geocoding/geocoding.module'
import { LanguageModule } from './modules/language/language.module'
import { TmdbModule } from './modules/tmdb/tmdb.module'
import { TitleCacheService } from './services/cache/title-cache.service'
import { TitleConfigCacheService } from './services/cache/title-config-cache.service'
import { TitleCountryService } from './services/relations/title-country.service'
import { TitleFilmingLocationService } from './services/relations/title-filming-location.service'
import { TitleGenreService } from './services/relations/title-genre.service'
import { TitleImageService } from './services/relations/title-image.service'
import { TitleLanguageService } from './services/relations/title-language.service'
import { TitleRelationService } from './services/relations/title-relation.service'
import { TitleTranslationService } from './services/relations/title-translation.service'
import { TitleConfigSyncService } from './services/sync/title-config-sync.service'
import { TitleElasticsearchLocationSyncService } from './services/sync/title-elasticsearch-location-sync.service'
import { TitleElasticsearchSyncService } from './services/sync/title-elasticsearch-sync.service'
import { TitleLocationDescriptionSyncQueueService } from './services/sync/title-location-description-sync-queue.service'
import { TitleLocationDescriptionSyncProcessor } from './services/sync/title-location-description-sync.processor'
import { TitleLocationDescriptionSyncService } from './services/sync/title-location-description-sync.service'
import { TitleLocationSyncProcessor } from './services/sync/title-location-sync.processor'
import { TitleLocationSyncService } from './services/sync/title-location-sync.service'
import { TitleSyncQueueService } from './services/sync/title-sync-queue.service'
import { TitleSyncProcessor } from './services/sync/title-sync.processor'
import { TitleSyncService } from './services/sync/title-sync.service'
import { TitleQueryService } from './services/title-query.service'
import { TitleSearchService } from './services/title-search.service'
import { TitleService } from './services/title.service'
import { TitleChangeDetectorService } from './services/utils/title-change-detector.service'
import { TitleFetcherService } from './services/utils/title-fetcher.service'
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
        TitleElasticsearchModule,
        BullModule.registerQueue(
            {
                name: 'title-sync',
            },
            {
                name: 'title-location-sync',
            },
            {
                name: 'title-location-description-sync',
            },
        ),
        AiModule,
    ],
    providers: [
        TitleResolver,
        TitleService,
        TitleQueryService,
        TitleSearchService,
        TitleTransformService,
        TitleFetcherService,
        TitleCacheService,
        TitleConfigCacheService,
        TitleChangeDetectorService,
        TitleSupportedLanguagesConfig,
        TitleRelationsConfigService,

        // Sync
        TitleSyncService,
        TitleLocationSyncService,
        TitleLocationDescriptionSyncService,
        TitleConfigSyncService,
        TitleSyncProcessor,
        TitleLocationSyncProcessor,
        TitleLocationDescriptionSyncProcessor,
        TitleSyncQueueService,
        TitleLocationDescriptionSyncQueueService,
        TitleElasticsearchSyncService,
        TitleElasticsearchLocationSyncService,

        // Relations
        TitleRelationService,
        TitleCountryService,
        TitleFilmingLocationService,
        TitleLanguageService,
        TitleGenreService,
        TitleRelationService,
        TitleTranslationService,
        TitleImageService,
    ],
    exports: [
        TitleService,
        TitleSyncService,
        TitleConfigSyncService,
        TitleLocationSyncService,
        TitleLocationDescriptionSyncService,
        TitleQueryService,
        TitleSearchService,
        TitleSupportedLanguagesConfig,
        TitleRelationsConfigService,
    ],
})
export class TitleModule {}
