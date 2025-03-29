import { CacheService } from '@/modules/infrastructure/cache/cache.service'
import { DbTitle } from '@/modules/infrastructure/drizzle/schema/titles.schema'
import { dateReviver } from '@/shared/utils/time/date-retriever.util'
import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { TitleRelationsConfigService } from '../config/title-relations.config'
import { Title } from '../models/title.model'
import { TitleDocumentES } from '../modules/elasticsearch/types/title-elasticsearch-document.interface'
import { TitleElasticsearchSyncService } from './sync/title-elasticsearch-sync.service'
import { TitleService } from './title.service'
import { TitleTransformService } from './utils/title-transform.service'

@Injectable()
export class TitleQueryService {
    private readonly logger = new Logger(TitleQueryService.name)
    private readonly CACHE_KEY_PREFIX = 'title:details:'
    private readonly CACHE_TTL_SECONDS = 60 * 60 * 2 // 2 hours
    private CACHE_TITLE_DATE_KEYS = [
        'createdAt',
        'updatedAt',
        'lastSyncedAt',
        'release_date',
    ]

    constructor(
        private readonly titleService: TitleService,
        private readonly titleElasticsearchSyncService: TitleElasticsearchSyncService,
        private readonly titleTransformService: TitleTransformService,
        private readonly cacheService: CacheService,
        private readonly titleRelationsConfig: TitleRelationsConfigService,
    ) {}

    async getTitleById(id: string): Promise<Title> {
        const cacheKey = this.getTitleCacheKey(id)

        try {
            const cachedTitle = await this.cacheService.get<string>(cacheKey)
            if (cachedTitle) {
                this.logger.debug(`Cache hit for title ID: ${id}`)
                const title = JSON.parse(cachedTitle, (key, value) =>
                    dateReviver(this.CACHE_TITLE_DATE_KEYS, key, value),
                )
                return title as Title
            }

            this.logger.debug(`Cache miss for title ID: ${id}`)

            const dbTitle = await this.titleService.findById(id, {
                customRelations: this.titleRelationsConfig.FULL,
            })
            if (!dbTitle)
                throw new NotFoundException(`Title with ID ${id} not found`)

            const esTitle =
                await this.titleElasticsearchSyncService.getTitleDetailsFromElasticsearch(
                    id,
                )

            const finalTitle = this.combineDbAndEsTitleData(dbTitle, esTitle)

            await this.cacheService.set(
                cacheKey,
                JSON.stringify(finalTitle),
                this.CACHE_TTL_SECONDS,
            )
            this.logger.debug(`Title ID: ${id} saved to cache.`)

            return finalTitle
        } catch (error) {
            this.logger.error(`Error getting title by ID ${id}:`, error)
            throw error
        }
    }

    async getTitleByTmdbId(tmdbId: string): Promise<Title> {
        let dbTitle: DbTitle
        try {
            dbTitle = await this.titleService.findByTmdbId(tmdbId, {
                customRelations: this.titleRelationsConfig.FULL,
            })
            if (!dbTitle) {
                throw new NotFoundException(
                    `Title with TMDB ID ${tmdbId} not found`,
                )
            }
        } catch (error) {
            this.logger.error(
                `Error fetching title from DB by TMDB ID ${tmdbId}:`,
                error,
            )
            throw error
        }

        const cacheKey = this.getTitleCacheKey(dbTitle.id)

        try {
            const cachedTitle = await this.cacheService.get<string>(cacheKey)
            if (cachedTitle) {
                this.logger.debug(
                    `Cache hit for title ID: ${dbTitle.id} (found by TMDB ID: ${tmdbId})`,
                )
                const title = JSON.parse(cachedTitle, (key, value) =>
                    dateReviver(this.CACHE_TITLE_DATE_KEYS, key, value),
                )
                return title as Title
            }

            this.logger.debug(
                `Cache miss for title ID: ${dbTitle.id} (found by TMDB ID: ${tmdbId})`,
            )

            const esTitle =
                await this.titleElasticsearchSyncService.getTitleDetailsFromElasticsearch(
                    dbTitle.id,
                )

            const finalTitle = this.combineDbAndEsTitleData(dbTitle, esTitle)

            await this.cacheService.set(
                cacheKey,
                JSON.stringify(finalTitle),
                this.CACHE_TTL_SECONDS,
            )
            this.logger.debug(
                `Title ID: ${dbTitle.id} saved to cache (found by TMDB ID: ${tmdbId}).`,
            )

            return finalTitle
        } catch (error) {
            this.logger.error(
                `Error processing title (DB ID ${dbTitle.id}, TMDB ID ${tmdbId}) after DB fetch:`,
                error,
            )
            throw error
        }
    }

    async getTitleByImdbId(imdbId: string): Promise<Title> {
        let dbTitle: DbTitle
        try {
            dbTitle = await this.titleService.findByImdbId(imdbId, {
                customRelations: this.titleRelationsConfig.FULL,
            })
            if (!dbTitle) {
                throw new NotFoundException(
                    `Title with IMDB ID ${imdbId} not found`,
                )
            }
        } catch (error) {
            this.logger.error(
                `Error fetching title from DB by IMDB ID ${imdbId}:`,
                error,
            )
            throw error
        }

        const cacheKey = this.getTitleCacheKey(dbTitle.id)

        try {
            const cachedTitle = await this.cacheService.get<string>(cacheKey)
            if (cachedTitle) {
                this.logger.debug(
                    `Cache hit for title ID: ${dbTitle.id} (found by IMDB ID: ${imdbId})`,
                )
                const title = JSON.parse(cachedTitle, (key, value) =>
                    dateReviver(this.CACHE_TITLE_DATE_KEYS, key, value),
                )
                return title as Title
            }

            this.logger.debug(
                `Cache miss for title ID: ${dbTitle.id} (found by IMDB ID: ${imdbId})`,
            )

            const esTitle =
                await this.titleElasticsearchSyncService.getTitleDetailsFromElasticsearch(
                    dbTitle.id,
                )

            const finalTitle = this.combineDbAndEsTitleData(dbTitle, esTitle)

            await this.cacheService.set(
                cacheKey,
                JSON.stringify(finalTitle),
                this.CACHE_TTL_SECONDS,
            )
            this.logger.debug(
                `Title ID: ${dbTitle.id} saved to cache (found by IMDB ID: ${imdbId}).`,
            )

            return finalTitle
        } catch (error) {
            this.logger.error(
                `Error processing title (DB ID ${dbTitle.id}, IMDB ID ${imdbId}) after DB fetch:`,
                error,
            )
            throw error
        }
    }

    getCacheTitleDateKeys(): string[] {
        return this.CACHE_TITLE_DATE_KEYS
    }

    combineDbAndEsTitleData(
        dbTitle: DbTitle,
        esTitle: TitleDocumentES | null,
    ): Title {
        return this.titleTransformService.mergeDbAndEsDetails(
            dbTitle,
            esTitle?.details || null,
        )
    }

    private getTitleCacheKey(id: string): string {
        return `${this.CACHE_KEY_PREFIX}${id}`
    }
}
