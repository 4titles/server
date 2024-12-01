import { Injectable, Logger } from '@nestjs/common'
import { Title } from 'src/entities/title.entity'
import { IMDBTop100Service } from '../../imdb/services/imdb-top100.service'
import { RawTitleProcessorService } from './processors/raw-title-processor.service'
import { RawTitleEntityService } from './entity/raw-title-entity.service'
import { TitleType } from 'src/entities/title.entity'
import { CACHE_CONFIG, CACHE_ERRORS, getCacheKey } from '../config/cache.config'
import { CacheService } from 'src/modules/cache/cache.service'

@Injectable()
export class TitlesService {
    private readonly logger = new Logger(TitlesService.name)

    constructor(
        private readonly imdbTop100Service: IMDBTop100Service,
        private readonly rawTitleEntityService: RawTitleEntityService,
        private readonly rawTitleProcessorService: RawTitleProcessorService,
        private readonly cacheService: CacheService,
    ) {}

    async refreshCache(): Promise<void> {
        try {
            let rawTitles = await this.rawTitleEntityService.getRawTitles()

            if (!rawTitles.length) {
                this.logger.log(
                    'No existing raw titles found, fetching from IMDb',
                )
                const imdbTitles =
                    await this.imdbTop100Service.fetchTop100Titles()
                rawTitles =
                    await this.rawTitleEntityService.createFromIMDbTitles(
                        imdbTitles,
                    )
            }

            const processedTitles =
                await this.rawTitleProcessorService.processRawTitles(rawTitles)
            await this.cacheTitlesByType(processedTitles)

            this.logger.log('Cache refresh completed successfully')
        } catch (error) {
            this.logger.error('Failed to refresh cache:', error)
            throw error
        }
    }

    private async cacheTitlesByType(titles: Title[]): Promise<void> {
        try {
            const titlesByType = titles.reduce(
                (acc, title) => {
                    if (!acc[title.type]) {
                        acc[title.type] = []
                    }
                    acc[title.type].push(title)
                    return acc
                },
                {} as Record<TitleType, Title[]>,
            )

            await Promise.all(
                Object.entries(titlesByType).map(([type, typeTitles]) =>
                    this.cacheService.set(
                        getCacheKey.forTitleType(type as TitleType),
                        typeTitles,
                        CACHE_CONFIG.TITLES.TTL,
                    ),
                ),
            )

            this.logger.log(`Cached ${titles.length} titles by type`)
        } catch (error) {
            this.logger.error(
                CACHE_ERRORS.FAILED_TO_SET(CACHE_CONFIG.TITLES.PREFIX),
                error,
            )
        }
    }

    async clearCache(): Promise<void> {
        try {
            await this.rawTitleEntityService.clearCache()

            await Promise.all(
                getCacheKey
                    .forAllTitleTypes()
                    .map((key) => this.cacheService.del(key)),
            )

            this.logger.log('All caches cleared successfully')
        } catch (error) {
            this.logger.error(
                CACHE_ERRORS.FAILED_TO_DELETE(CACHE_CONFIG.TITLES.PREFIX),
                error,
            )
            throw error
        }
    }

    async getTitlesByType(type: TitleType): Promise<Title[]> {
        try {
            const cacheKey = getCacheKey.forTitleType(type)
            const cachedTitles = await this.cacheService.get<Title[]>(cacheKey)

            if (cachedTitles) {
                this.logger.debug(
                    `Retrieved ${cachedTitles.length} titles of type ${type} from cache`,
                )
                return cachedTitles
            }

            this.logger.warn(`Cache miss for titles of type ${type}`)
            return []
        } catch (error) {
            this.logger.error(
                CACHE_ERRORS.FAILED_TO_GET(getCacheKey.forTitleType(type)),
                error,
            )
            return []
        }
    }
}
