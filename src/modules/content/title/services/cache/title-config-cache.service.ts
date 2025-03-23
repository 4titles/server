import { CacheService } from '@/modules/infrastructure/cache/cache.service'
import { Injectable, Logger } from '@nestjs/common'
import { HashUtils } from '../../../../../shared/utils/common/hash.utils'
import { GenresByLanguage } from '../../modules/genre/models/genres-by-language.model'
import { TmdbCountry } from '../../modules/tmdb/models/tmdb-country.model'
import { TmdbLanguage } from '../../modules/tmdb/models/tmdb-language.model'

@Injectable()
export class TitleConfigCacheService {
    private readonly logger = new Logger(TitleConfigCacheService.name)
    private readonly REDIS_KEY_PREFIX = 'title:config:'
    private readonly REDIS_EXPIRE_TIME = 60 * 60 * 24 * 30 // 30 days

    constructor(private readonly cacheService: CacheService) {}

    async getCachedCountries(): Promise<TmdbCountry[] | null> {
        const data = await this.cacheService.get<string>(this.getCountriesKey())
        return data ? JSON.parse(data) : null
    }

    async getCachedLanguages(): Promise<TmdbLanguage[] | null> {
        const data = await this.cacheService.get<string>(this.getLanguagesKey())
        return data ? JSON.parse(data) : null
    }

    async getCachedGenres(): Promise<GenresByLanguage | null> {
        const data = await this.cacheService.get<string>(this.getGenresKey())
        return data ? JSON.parse(data) : null
    }

    async cacheCountries(countries: TmdbCountry[]): Promise<void> {
        await this.cacheService.set(
            this.getCountriesKey(),
            JSON.stringify(countries),
            this.REDIS_EXPIRE_TIME,
        )
    }

    async cacheLanguages(languages: TmdbLanguage[]): Promise<void> {
        await this.cacheService.set(
            this.getLanguagesKey(),
            JSON.stringify(languages),
            this.REDIS_EXPIRE_TIME,
        )
    }

    async cacheGenres(genres: GenresByLanguage): Promise<void> {
        await this.cacheService.set(
            this.getGenresKey(),
            JSON.stringify(genres),
            this.REDIS_EXPIRE_TIME,
        )
    }

    async extendCountriesTTL(): Promise<void> {
        const key = this.getCountriesKey()
        const data = await this.cacheService.get(key)
        if (data) {
            await this.cacheService.set(key, data, this.REDIS_EXPIRE_TIME)
        }
    }

    async extendLanguagesTTL(): Promise<void> {
        const key = this.getLanguagesKey()
        const data = await this.cacheService.get(key)
        if (data) {
            await this.cacheService.set(key, data, this.REDIS_EXPIRE_TIME)
        }
    }

    async extendGenresTTL(): Promise<void> {
        const key = this.getGenresKey()
        const data = await this.cacheService.get(key)
        if (data) {
            await this.cacheService.set(key, data, this.REDIS_EXPIRE_TIME)
        }
    }

    areCountriesChanged(
        cached: TmdbCountry[] | null,
        newData: TmdbCountry[],
    ): boolean {
        return HashUtils.areArraysChanged(cached, newData)
    }

    areLanguagesChanged(
        cached: TmdbLanguage[] | null,
        newData: TmdbLanguage[],
    ): boolean {
        return HashUtils.areArraysChanged(cached, newData)
    }

    areGenresChanged(
        cached: GenresByLanguage | null,
        newData: GenresByLanguage,
    ): boolean {
        return HashUtils.areObjectsChanged(cached, newData)
    }

    private getCountriesKey(): string {
        return `${this.REDIS_KEY_PREFIX}countries`
    }

    private getLanguagesKey(): string {
        return `${this.REDIS_KEY_PREFIX}languages`
    }

    private getGenresKey(): string {
        return `${this.REDIS_KEY_PREFIX}genres`
    }
}
