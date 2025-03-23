import { CacheService } from '@/modules/infrastructure/cache/cache.service'
import { Injectable, Logger } from '@nestjs/common'
import {
    CreditsResponse,
    MovieRecommendationsResponse,
    SimilarMovieResponse,
    TvExternalIdsResponse,
    TvResultsResponse,
    TvSimilarShowsResponse,
} from 'moviedb-promise'
import { TitleCategory } from '../../enums/title-category.enum'
import { RawLocation } from '../../modules/filming-location/interfaces/raw-location.interface'
import {
    TmdbImages,
    TmdbTitleExtendedResponse,
} from '../../modules/tmdb/types/tmdb.interface'

@Injectable()
export class TitleCacheService {
    private readonly logger = new Logger(TitleCacheService.name)
    private readonly REDIS_KEY_PREFIX = 'title:'
    private readonly REDIS_EXPIRE_TIME = 60 * 60 * 24 * 7 // 1 week

    constructor(private readonly cacheService: CacheService) {}

    async clearAllTitlesCache(): Promise<void> {
        try {
            const client = await this.cacheService.getClient()
            const keys = await client.keys(`${this.REDIS_KEY_PREFIX}*`)

            this.logger.debug(
                `Deleting ${keys.length} keys related to titles from Redis`,
            )

            const batchSize = 1000
            for (let i = 0; i < keys.length; i += batchSize) {
                const batch = keys.slice(i, i + batchSize)
                await Promise.all(batch.map((key) => client.del(key)))
            }

            this.logger.debug('Redis cache cleared successfully')
        } catch (error) {
            this.logger.error('Failed to clear Redis cache:', error)
            throw error
        }
    }

    async storeDetailedInfoInRedis(
        titleId: string,
        detailedInfo: TmdbTitleExtendedResponse,
        category: TitleCategory,
    ): Promise<void> {
        try {
            const redisData = {
                ...detailedInfo,
                _cached_at: new Date().toISOString(),
            }

            await this.cacheService.set(
                this.getDetailsKey(titleId, category),
                JSON.stringify(redisData),
                this.REDIS_EXPIRE_TIME,
            )

            const additionalData = [
                {
                    key: this.getCreditsKey(titleId, category),
                    data: detailedInfo.credits,
                },
                {
                    key: this.getKeywordsKey(titleId, category),
                    data: detailedInfo.keywords,
                },
                {
                    key: this.getAlternativeTitlesKey(titleId, category),
                    data: detailedInfo.alternative_titles,
                },
                {
                    key: this.getExternalIdsKey(titleId, category),
                    data: detailedInfo.external_ids,
                },
                {
                    key: this.getImagesKey(titleId, category),
                    data: detailedInfo.images,
                },
                {
                    key: this.getRecommendationsKey(titleId, category, 1),
                    data: detailedInfo.recommendations,
                },
                {
                    key: this.getSimilarKey(titleId, category, 1),
                    data: detailedInfo.similar,
                },
            ]

            await Promise.all(
                additionalData
                    .filter(({ data }) => data)
                    .map(({ key, data }) =>
                        this.cacheService.set(
                            key,
                            JSON.stringify(data),
                            this.REDIS_EXPIRE_TIME,
                        ),
                    ),
            )
        } catch (error) {
            this.logger.error(
                `Failed to store detailed info in Redis for title ${titleId}: ${error.message}`,
            )
            throw error
        }
    }

    async getDetails(
        titleId: string,
        category: TitleCategory,
    ): Promise<TmdbTitleExtendedResponse | null> {
        const data = await this.cacheService.get<string>(
            this.getDetailsKey(titleId, category),
        )
        return data ? JSON.parse(data) : null
    }

    async getCredits(
        titleId: string,
        category: TitleCategory,
    ): Promise<CreditsResponse | null> {
        const data = await this.cacheService.get<string>(
            this.getCreditsKey(titleId, category),
        )
        return data ? JSON.parse(data) : null
    }

    async getImages(
        titleId: string,
        category: TitleCategory,
    ): Promise<TmdbImages | null> {
        const data = await this.cacheService.get<string>(
            this.getImagesKey(titleId, category),
        )
        return data ? JSON.parse(data) : null
    }

    async getKeywords(
        titleId: string,
        category: TitleCategory,
    ): Promise<any | null> {
        const data = await this.cacheService.get<string>(
            this.getKeywordsKey(titleId, category),
        )
        return data ? JSON.parse(data) : null
    }

    async getAlternativeTitles(
        titleId: string,
        category: TitleCategory,
    ): Promise<any | null> {
        const data = await this.cacheService.get<string>(
            this.getAlternativeTitlesKey(titleId, category),
        )
        return data ? JSON.parse(data) : null
    }

    async getRecommendations(
        titleId: string,
        category: TitleCategory,
        page: number,
    ): Promise<MovieRecommendationsResponse | TvResultsResponse | null> {
        const data = await this.cacheService.get<string>(
            this.getRecommendationsKey(titleId, category, page),
        )
        return data ? JSON.parse(data) : null
    }

    async getSimilar(
        titleId: string,
        category: TitleCategory,
        page: number,
    ): Promise<SimilarMovieResponse | TvSimilarShowsResponse | null> {
        const data = await this.cacheService.get<string>(
            this.getSimilarKey(titleId, category, page),
        )
        return data ? JSON.parse(data) : null
    }

    async getExternalIds(
        titleId: string,
        category: TitleCategory,
    ): Promise<TvExternalIdsResponse | null> {
        const data = await this.cacheService.get<string>(
            this.getExternalIdsKey(titleId, category),
        )
        return data ? JSON.parse(data) : null
    }

    async getCategoryLastSync(category: TitleCategory): Promise<Date | null> {
        const client = await this.cacheService.getClient()
        const keys = await client.keys(
            `${this.REDIS_KEY_PREFIX}${category.toLowerCase()}:*:details`,
        )

        if (keys.length === 0) return null

        const firstKey = keys[0]
        const data = await this.cacheService.get<string>(firstKey)

        if (!data) return null

        const parsedData = JSON.parse(data)
        return new Date(parsedData._cached_at)
    }

    async storeFilmingLocations(
        titleId: string,
        category: TitleCategory,
        locations: RawLocation[],
    ): Promise<void> {
        await this.cacheService.set(
            this.getFilmingLocationsKey(titleId, category),
            JSON.stringify(locations),
            this.REDIS_EXPIRE_TIME,
        )
    }

    async getFilmingLocations(
        titleId: string,
        category: TitleCategory,
    ): Promise<RawLocation[] | null> {
        const data = await this.cacheService.get<string>(
            this.getFilmingLocationsKey(titleId, category),
        )
        return data ? JSON.parse(data) : null
    }

    async extendFilmingLocationsTTL(
        titleId: string,
        category: TitleCategory,
    ): Promise<void> {
        const key = this.getFilmingLocationsKey(titleId, category)
        await this.cacheService.set(
            key,
            await this.cacheService.get(key),
            this.REDIS_EXPIRE_TIME,
        )
    }

    async extendTitleTTL(
        titleId: string,
        category: TitleCategory,
    ): Promise<void> {
        const keys = [
            this.getDetailsKey(titleId, category),
            this.getCreditsKey(titleId, category),
            this.getImagesKey(titleId, category),
            this.getKeywordsKey(titleId, category),
            this.getAlternativeTitlesKey(titleId, category),
            this.getExternalIdsKey(titleId, category),
        ]

        await Promise.all(
            keys.map(async (key) => {
                const data = await this.cacheService.get(key)
                if (data) {
                    await this.cacheService.set(
                        key,
                        data,
                        this.REDIS_EXPIRE_TIME,
                    )
                }
            }),
        )
    }

    private getDetailsKey(titleId: string, category: TitleCategory): string {
        return `${this.REDIS_KEY_PREFIX}${category.toLowerCase()}:${titleId}:details`
    }

    private getCreditsKey(titleId: string, category: TitleCategory): string {
        return `${this.REDIS_KEY_PREFIX}${category.toLowerCase()}:${titleId}:credits`
    }

    private getImagesKey(titleId: string, category: TitleCategory): string {
        return `${this.REDIS_KEY_PREFIX}${category.toLowerCase()}:${titleId}:images`
    }

    private getKeywordsKey(titleId: string, category: TitleCategory): string {
        return `${this.REDIS_KEY_PREFIX}${category.toLowerCase()}:${titleId}:keywords`
    }

    private getAlternativeTitlesKey(
        titleId: string,
        category: TitleCategory,
    ): string {
        return `${this.REDIS_KEY_PREFIX}${category.toLowerCase()}:${titleId}:alternative_titles`
    }

    private getExternalIdsKey(
        titleId: string,
        category: TitleCategory,
    ): string {
        return `${this.REDIS_KEY_PREFIX}${category.toLowerCase()}:${titleId}:external_ids`
    }

    private getRecommendationsKey(
        titleId: string,
        category: TitleCategory,
        page: number,
    ): string {
        return `${this.REDIS_KEY_PREFIX}${category.toLowerCase()}:${titleId}:recommendations:${page}`
    }

    private getSimilarKey(
        titleId: string,
        category: TitleCategory,
        page: number,
    ): string {
        return `${this.REDIS_KEY_PREFIX}${category.toLowerCase()}:${titleId}:similar:${page}`
    }

    private getFilmingLocationsKey(
        titleId: string,
        category: TitleCategory,
    ): string {
        return `${this.REDIS_KEY_PREFIX}${category.toLowerCase()}:${titleId}:filming_locations`
    }

    private filterImagesByLanguages(
        images: TmdbImages,
        supportedLanguages: string[],
    ): TmdbImages {
        if (!images) return images

        const filtered = { ...images }

        if (filtered.posters) {
            filtered.posters = filtered.posters.filter(
                (poster) =>
                    !poster.iso_639_1 ||
                    supportedLanguages.includes(poster.iso_639_1),
            )
        }

        if (filtered.backdrops) {
            filtered.backdrops = filtered.backdrops.filter(
                (backdrop) =>
                    !backdrop.iso_639_1 ||
                    supportedLanguages.includes(backdrop.iso_639_1),
            )
        }

        return filtered
    }
}
