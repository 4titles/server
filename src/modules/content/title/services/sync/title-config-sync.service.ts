import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { CountryService } from '../../modules/country/country.service'
import { GenreService } from '../../modules/genre/genre.service'
import { LanguageService } from '../../modules/language/language.service'
import { TitleConfigCacheService } from '../cache/title-config-cache.service'

@Injectable()
export class TitleConfigSyncService {
    private readonly logger = new Logger(TitleConfigSyncService.name)

    constructor(
        private readonly countryService: CountryService,
        private readonly languageService: LanguageService,
        private readonly genreService: GenreService,
        private readonly configCacheService: TitleConfigCacheService,
    ) {}

    @Cron(CronExpression.EVERY_WEEK)
    async syncConfigs(): Promise<void> {
        this.logger.log('Starting configs sync...')
        try {
            await Promise.all([
                this.syncCountries(),
                this.syncLanguages(),
                this.syncGenres(),
            ])
            this.logger.log('Configs sync completed successfully')
        } catch (error) {
            this.logger.error(`Failed to sync configs: ${error.message}`)
            throw error
        }
    }

    private async syncCountries(): Promise<void> {
        const cachedCountries =
            await this.configCacheService.getCachedCountries()
        const tmdbCountries =
            await this.countryService.getCountriesListFromTmdb()

        if (
            this.configCacheService.areCountriesChanged(
                cachedCountries,
                tmdbCountries,
            )
        ) {
            this.logger.log('Countries have changed, updating...')
            const countriesToCreate = tmdbCountries.map((country) => ({
                iso: country.iso_3166_1,
                name: country.native_name,
                englishName: country.english_name,
            }))
            const upsertedCount =
                await this.countryService.createMany(countriesToCreate)
            this.logger.log(`Upserted ${upsertedCount} countries`)
            await this.configCacheService.cacheCountries(tmdbCountries)
        } else {
            this.logger.debug('Countries are up to date')
            await this.configCacheService.extendCountriesTTL()
        }
    }

    private async syncLanguages(): Promise<void> {
        const cachedLanguages =
            await this.configCacheService.getCachedLanguages()
        const tmdbLanguages =
            await this.languageService.getLanguagesListFromTmdb()

        if (
            this.configCacheService.areLanguagesChanged(
                cachedLanguages,
                tmdbLanguages,
            )
        ) {
            this.logger.log('Languages have changed, updating...')
            const languagesToCreate = tmdbLanguages.map((language) => ({
                iso: language.iso_639_1,
                englishName: language.english_name,
                nativeName: language.name,
            }))
            const upsertedCount =
                await this.languageService.createMany(languagesToCreate)
            this.logger.log(`Upserted ${upsertedCount} languages`)
            await this.configCacheService.cacheLanguages(tmdbLanguages)
        } else {
            this.logger.debug('Languages are up to date')
            await this.configCacheService.extendLanguagesTTL()
        }
    }

    async syncGenres(): Promise<void> {
        const cachedGenres = await this.configCacheService.getCachedGenres()
        const tmdbGenres = await this.genreService.getGenresListFromTmdb()

        if (
            this.configCacheService.areGenresChanged(cachedGenres, tmdbGenres)
        ) {
            this.logger.log('Genres have changed, updating...')

            const genreMap = new Map<
                string,
                { tmdbId: string; names: { en?: string; ru: string } }
            >()

            tmdbGenres.en?.forEach((genre) => {
                genreMap.set(String(genre.id), {
                    tmdbId: String(genre.id),
                    names: { en: genre.name, ru: undefined },
                })
            })

            tmdbGenres.ru?.forEach((genre) => {
                const tmdbId = String(genre.id)
                if (genreMap.has(tmdbId)) {
                    const existingGenre = genreMap.get(tmdbId)
                    existingGenre.names.ru = genre.name
                } else {
                    genreMap.set(tmdbId, {
                        tmdbId: tmdbId,
                        names: { en: undefined, ru: genre.name },
                    })
                }
            })

            const genresToCreate = Array.from(genreMap.values())
            const upsertedCount =
                await this.genreService.createMany(genresToCreate)
            this.logger.log(`Upserted ${upsertedCount} genres`)
            await this.configCacheService.cacheGenres(tmdbGenres)
        } else {
            this.logger.debug('Genres are up to date')
            await this.configCacheService.extendGenresTTL()
        }
    }
}
