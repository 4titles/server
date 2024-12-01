import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { RawTitle } from 'src/entities/raw_title.entity'
import { CacheService } from 'src/modules/cache/cache.service'
import { ITitle } from 'src/modules/imdb/interfaces/imdb-top100.interface'
import { TitleType } from 'src/entities/title.entity'
import {
    CACHE_CONFIG,
    CACHE_ERRORS,
    getCacheKey,
} from '../../config/cache.config'

@Injectable()
export class RawTitleEntityService {
    private readonly logger = new Logger(RawTitleEntityService.name)

    constructor(
        @InjectRepository(RawTitle)
        private readonly rawTitleRepository: Repository<RawTitle>,
        private readonly cacheService: CacheService,
    ) {}

    async getRawTitles(): Promise<RawTitle[]> {
        const cachedRawTitles = await this.getRawTitlesFromCache()
        if (cachedRawTitles?.length) {
            this.logger.log('Using cached raw titles')
            return cachedRawTitles
        }

        const dbRawTitles = await this.getRawTitlesFromDB()
        if (dbRawTitles?.length) {
            this.logger.log('Using raw titles from database')
            await this.cacheRawTitles(dbRawTitles)
            return dbRawTitles
        }

        return []
    }

    async createFromIMDbTitles(titles: ITitle[]): Promise<RawTitle[]> {
        const rawTitles = titles.map((title) => ({
            imdbId: title.imdbid,
            type: title.type as TitleType,
            data: title,
        }))

        const savedRawTitles = await this.rawTitleRepository.save(rawTitles)
        await this.cacheRawTitles(savedRawTitles)

        return savedRawTitles
    }

    private async getRawTitlesFromCache(): Promise<RawTitle[] | null> {
        try {
            return await this.cacheService.get<RawTitle[]>(
                getCacheKey.forRawTitles(),
            )
        } catch (error) {
            this.logger.error(
                CACHE_ERRORS.FAILED_TO_GET(getCacheKey.forRawTitles()),
                error,
            )
            return null
        }
    }

    private async getRawTitlesFromDB(): Promise<RawTitle[] | null> {
        try {
            const rawTitles = await this.rawTitleRepository.find()
            return rawTitles.length > 0 ? rawTitles : null
        } catch (error) {
            this.logger.error('Failed to get raw titles from database:', error)
            return null
        }
    }

    private async cacheRawTitles(rawTitles: RawTitle[]): Promise<void> {
        try {
            await this.cacheService.set(
                getCacheKey.forRawTitles(),
                rawTitles,
                CACHE_CONFIG.RAW_TITLES.TTL,
            )
            this.logger.log(`Cached ${rawTitles.length} raw titles`)
        } catch (error) {
            this.logger.error(
                CACHE_ERRORS.FAILED_TO_SET(getCacheKey.forRawTitles()),
                error,
            )
        }
    }

    async clearCache(): Promise<void> {
        try {
            await this.cacheService.del(getCacheKey.forRawTitles())
            this.logger.log('Raw titles cache cleared successfully')
        } catch (error) {
            this.logger.error(
                CACHE_ERRORS.FAILED_TO_DELETE(getCacheKey.forRawTitles()),
                error,
            )
            throw error
        }
    }
}
