import { Injectable, Logger } from '@nestjs/common'
import { LanguageEntityService } from './entity/language-entity.service'
import { Language } from '../models/language.model'
import { LanguageMapper } from '../mappers/language.mapper'
import { SeriesLanguageType } from '../enums/series-language-type.enum'
import { MovieLanguageType } from '../enums/movie-language-type.enum'
import { SpokenLanguage } from '../models/common.model'
import { TitleEntityService } from './entity'
import { GroupedLanguages, TitleLanguage } from '../types/language.type'
import { TitleType } from '../enums/title-type.enum'
import { LANGUAGE_TYPE_MAPPING } from './constants/language.constants'
import { DbLanguage } from '@/modules/drizzle/schema/languages.schema'

@Injectable()
export class LanguageService {
    private readonly logger = new Logger(LanguageService.name)

    constructor(
        private readonly languageEntityService: LanguageEntityService,
        private readonly titleEntityService: TitleEntityService,
    ) {}

    async getAll(): Promise<Language[]> {
        return LanguageMapper.manyToGraphQL(
            await this.languageEntityService.getAll(),
        )
    }

    async getLanguageByIso(iso: string): Promise<Language | null> {
        const language = await this.languageEntityService.getByIso(iso)
        return language ? LanguageMapper.toGraphQL(language) : null
    }

    async getLanguagesForTitle(
        imdbId: string,
        titleType: TitleType,
    ): Promise<GroupedLanguages> {
        try {
            const isMovie: boolean = titleType === TitleType.MOVIES
            const title = isMovie
                ? await this.titleEntityService.findMovieByImdbId(imdbId)
                : await this.titleEntityService.findTvShowByImdbId(imdbId)

            const languagesData = await this.fetchLanguagesData(
                title.id,
                isMovie,
            )
            return this.groupLanguages(languagesData, titleType)
        } catch (error) {
            this.logger.log(
                `Failed to find languages for title with imdbId ${imdbId}: ${error.message}`,
            )
        }
    }

    private async fetchLanguagesData(
        titleId: bigint,
        isMovie: boolean,
    ): Promise<TitleLanguage[]> {
        try {
            if (isMovie) {
                const movieLanguages =
                    await this.languageEntityService.getForMovie(titleId)
                return movieLanguages.map((relation) => ({
                    language: relation.language,
                    type: relation.type,
                }))
            } else {
                const seriesLanguages =
                    await this.languageEntityService.getForSeries(titleId)
                return seriesLanguages.map((relation) => ({
                    language: relation.language,
                    type: relation.type,
                }))
            }
        } catch (error) {
            this.logger.error(
                `Failed to fetch languages for title ${titleId}: ${error.message}`,
                error.stack,
            )
            return []
        }
    }

    private groupLanguages(
        data: TitleLanguage[],
        titleType: TitleType,
    ): GroupedLanguages {
        const typeConfig = LANGUAGE_TYPE_MAPPING[titleType]

        return Object.entries(typeConfig).reduce(
            (acc, [group, expectedType]) => {
                acc[group as keyof GroupedLanguages] = data
                    .filter(({ type }) => type === expectedType)
                    .map(({ language }) =>
                        LanguageMapper.toGraphQL(language as DbLanguage),
                    )
                return acc
            },
            {} as GroupedLanguages,
        )
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
