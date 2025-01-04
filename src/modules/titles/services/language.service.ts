import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common'
import { LanguageEntityService } from './entity/language-entity.service'
import {
    Language,
    MovieLanguage,
    SeriesLanguage,
} from '../models/language.model'
import { LanguageMapper } from '../mappers/language.mapper'
import { SeriesLanguageType } from '../enums/series-language-type.enum'
import { MovieLanguageType } from '../enums/movie-language-type.enum'
import { SpokenLanguage } from '../models/common.model'
import { TitleEntityService } from './entity'
import {
    MovieLanguageWithRelations,
    SeriesLanguageWithRelations,
} from '../types/language.type'
import { TitleMapper } from '../mappers'

@Injectable()
export class LanguageService {
    private readonly logger = new Logger(LanguageService.name)

    constructor(
        private readonly languageEntityService: LanguageEntityService,
        private readonly titleEntityService: TitleEntityService,
        @Inject(forwardRef(() => TitleMapper))
        private readonly titleMapper: TitleMapper,
    ) {}

    async getLanguageByIso(iso: string): Promise<Language | null> {
        const language = await this.languageEntityService.getByIso(iso)
        return language ? LanguageMapper.toGraphQL(language) : null
    }

    async getLanguagesForTitle(
        imdbId: string,
    ): Promise<MovieLanguage[] | SeriesLanguage[]> {
        try {
            const { movie, series } =
                await this.titleEntityService.findByImdbId(imdbId)

            if (!!movie) {
                const languages = (await this.languageEntityService.getForMovie(
                    movie.id,
                )) as MovieLanguageWithRelations[]

                return languages.map((lang) => ({
                    language: LanguageMapper.toGraphQL(lang),
                    type: lang.movies[0]?.type || MovieLanguageType.SPOKEN,
                }))
            } else {
                const languages =
                    (await this.languageEntityService.getForSeries(
                        series.id,
                    )) as SeriesLanguageWithRelations[]

                return languages.map((lang) => ({
                    language: LanguageMapper.toGraphQL(lang),
                    type: lang.series[0]?.type || SeriesLanguageType.SPOKEN,
                }))
            }
        } catch (error) {
            this.logger.error(
                `Failed to get languages for title with imdbId ${imdbId}:`,
                error,
            )
            return []
        }
    }

    async syncLanguagesForMovie(
        imdbd: string,
        originalLanguage: string,
        spokenLanguages: SpokenLanguage[],
    ) {
        try {
            const movie = await this.titleEntityService.findMovieByImdbId(imdbd)

            const [originalLang] =
                await this.languageEntityService.createOrUpdate({
                    iso: originalLanguage,
                    englishName: originalLanguage,
                })

            await this.languageEntityService.saveMovieLanguages(
                movie.id,
                [originalLang.id],
                MovieLanguageType.ORIGINAL,
            )

            const spokenLangs = await Promise.all(
                spokenLanguages.map((lang) =>
                    this.languageEntityService.createOrUpdate({
                        iso: lang.iso_639_1,
                        englishName: lang.english_name,
                        name: lang.name,
                    }),
                ),
            )

            await this.languageEntityService.saveMovieLanguages(
                movie.id,
                spokenLangs.map((lang) => lang[0].id),
                MovieLanguageType.SPOKEN,
            )

            return true
        } catch (error) {
            this.logger.error(
                `Failed to sync languages for movie with imdbId ${imdbd}`,
                error,
            )
            return false
        }
    }

    async syncLanguagesForSeries(
        imdbId: string,
        originalLanguage: string,
        spokenLanguages: SpokenLanguage[],
        availableLanguages: string[],
    ) {
        try {
            const series =
                await this.titleEntityService.findTvShowByImdbId(imdbId)

            const [originalLang] =
                await this.languageEntityService.createOrUpdate({
                    iso: originalLanguage,
                    englishName: originalLanguage,
                })

            await this.languageEntityService.saveSeriesLanguages(
                series.id,
                [originalLang.id],
                SeriesLanguageType.ORIGINAL,
            )

            const spokenLangs = await Promise.all(
                spokenLanguages.map((lang) =>
                    this.languageEntityService.createOrUpdate({
                        iso: lang.iso_639_1,
                        englishName: lang.english_name,
                        name: lang.name,
                    }),
                ),
            )

            await this.languageEntityService.saveSeriesLanguages(
                series.id,
                spokenLangs.map((lang) => lang[0].id),
                SeriesLanguageType.SPOKEN,
            )

            const availableLangs = await Promise.all(
                availableLanguages.map((iso) =>
                    this.languageEntityService.createOrUpdate({
                        iso,
                        englishName: iso,
                    }),
                ),
            )

            await this.languageEntityService.saveSeriesLanguages(
                series.id,
                availableLangs.map((lang) => lang[0].id),
                SeriesLanguageType.AVAILABLE,
            )

            return true
        } catch (error) {
            this.logger.error(
                `Failed to sync languages for tvShow with imdbId ${imdbId}:`,
                error,
            )
            return false
        }
    }
}
