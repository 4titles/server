import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { ITitle } from 'src/modules/imdb-top100/interfaces/imdb-top100.response'
import { IMDBTop100Service } from 'src/modules/imdb-top100/services/imdb-top100.service'
import { CacheService } from 'src/modules/places/services/cache.service'
import { Title, TitleType } from '../entities/title.entity'
import { Repository } from 'typeorm'
import { TitleCreationDTO } from '../dto/title-creation.dto'

@Injectable()
export class TitlesService {
    private readonly CACHE_PREFIX = 'titles'
    private readonly CACHE_TTL = 3600 * 24 * 90 // 3 months
    private readonly logger = new Logger(TitlesService.name)

    constructor(
        @InjectRepository(Title)
        private titlesRepository: Repository<Title>,
        private readonly imdbTop100Service: IMDBTop100Service,
        private readonly cacheService: CacheService,
    ) {}

    async findTitles(type?: TitleType): Promise<Title[]> {
        const cacheKey = this.getCacheKey(type)
        const cachedData = await this.cacheService.get<Title[]>(cacheKey)
        if (cachedData) return cachedData

        const dbQuery = type ? { where: { type } } : {}

        try {
            const titlesFromDb = await this.titlesRepository.find(dbQuery)
            await this.cacheService.set(cacheKey, titlesFromDb, this.CACHE_TTL)
            return titlesFromDb
        } catch {
            return []
        }
    }

    async findByImdbId(imdbIds: string[]): Promise<Title[]> {
        return this.titlesRepository.find({
            where: imdbIds.map((imdbid) => ({ imdbid })),
        })
    }

    private async fetchAndSaveTitlesFromApi(
        cacheKey: string,
        type?: TitleType,
    ): Promise<Title[]> {
        const titlesFromApi = await this.fetchDataFromAPI(type)
        if (!titlesFromApi.length) return []

        const existingTitles = await this.findByImdbId(
            titlesFromApi.map((title) => title.imdbid),
        )
        const existingIds = new Set(existingTitles.map((title) => title.imdbid))
        const newTitles = titlesFromApi.filter(
            (title) => !existingIds.has(title.imdbid),
        )

        await this.cacheService.set(cacheKey, existingTitles, this.CACHE_TTL)
        if (!newTitles?.length) return existingTitles

        const titleEntities = newTitles.map((title) => {
            const titleCreationDTO = new TitleCreationDTO()

            titleCreationDTO.titleName = title.title
            titleCreationDTO.imdbid = title.imdbid
            titleCreationDTO.type = title.type
            titleCreationDTO.rank = title.rank
            titleCreationDTO.image = title.big_image
            titleCreationDTO.description = title.description
            titleCreationDTO.genre = title.genre
            titleCreationDTO.rating = title.rating
            titleCreationDTO.imdbLink = title.imdb_link
            titleCreationDTO.year = title.year

            return this.titlesRepository.create(titleCreationDTO)
        })

        try {
            const savedTitles = await this.titlesRepository.save(titleEntities)
            await this.cacheService.set(cacheKey, savedTitles, this.CACHE_TTL)
            return savedTitles
        } catch (err) {
            this.handleError(err)
            return []
        }
    }

    private async fetchDataFromAPI(type?: TitleType): Promise<ITitle[]> {
        try {
            switch (type) {
                case TitleType.MOVIE:
                    return await this.imdbTop100Service.fetchTop100Movies()
                case TitleType.TV_SERIES:
                    return await this.imdbTop100Service.fetchTop100TVSeries()
                default:
                    return await this.imdbTop100Service.fetchTop100Titles()
            }
        } catch (error) {
            this.logger.error('API fetching error', error)
            return []
        }
    }

    async refreshCache(): Promise<void> {
        const types = [TitleType.MOVIE, TitleType.TV_SERIES]

        try {
            for (const type of types) {
                const cacheKey = this.getCacheKey(type)
                await this.fetchAndSaveTitlesFromApi(cacheKey, type)
            }
        } catch (error) {
            this.handleError(error)
        }
    }

    private getCacheKey(type?: TitleType): string {
        return type
            ? `${this.CACHE_PREFIX}:${type.toLowerCase()}`
            : this.CACHE_PREFIX
    }

    private handleError(error: any): Error {
        this.logger.error('Error occured in TitlesService', error)
        return new Error()
    }
}
