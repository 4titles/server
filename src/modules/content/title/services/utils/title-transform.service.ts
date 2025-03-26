import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import {
    CollectionTranslationsResponse,
    MovieAlternativeTitlesResponse,
    MovieResponse,
    ShowAlternativeTitlesResponse,
    ShowResponse,
} from 'moviedb-promise'
import { DbTitle } from '../../../../../../dist/src/modules/titles/types/title.type'
import { TmdbTitleDataDTO } from '../../dto/tmdb-title-data.dto'
import { TitleStatus } from '../../enums/title-status.enum'
import { TitleType } from '../../enums/title-type.enum'
import {
    Title,
    TitleAlternativeTitle,
    TitleDetails,
} from '../../models/title.model'
import {
    ExtendedMovieResponse,
    ExtendedShowResponse,
    TmdbTitleAlternativeTitlesResponse,
    TmdbTitleExtendedResponse,
    TmdbTitleResponse,
} from '../../modules/tmdb/types/tmdb.interface'

@Injectable()
export class TitleTransformService {
    private readonly defaultTmdbLanguage: string

    constructor(private readonly configService: ConfigService) {
        this.defaultTmdbLanguage =
            this.configService.get<string>('tmdb.defaultLanguage') || 'ru'
    }

    createTitleDataFromTmdbResults(data: TmdbTitleDataDTO): Partial<Title> {
        const isMovie = data.type === TitleType.MOVIE
        const movieInfo = data.titleDetails as MovieResponse
        const showInfo = data.titleDetails as ShowResponse

        return {
            tmdbId: String(data.title.id),
            imdbId: data.imdbId || null,
            name: isMovie ? movieInfo.title : (data.title as ShowResponse).name,
            originalName: isMovie
                ? movieInfo.original_title
                : showInfo.original_name,
            type: data.type,
            category: data.category,
            status: this.mapTitleStatus(data.titleDetails.status),
            isAdult: movieInfo.adult || false,
            posterPath: data.title.poster_path,
            backdropPath: data.title.backdrop_path,
            popularity: data.title.popularity,
            overview: this.processOverview(
                data.titleDetails.overview,
                data.titleDetails.translations,
                this.defaultTmdbLanguage,
            ),
            details: this.extractBasicDetails(data.titleDetails),
            images: data.titleDetails.images,
            keywords: data.titleDetails.keywords,
            credits: data.titleDetails.credits,
            alternativeTitles: this.extractAlternativeTitles(
                data.titleDetails.alternative_titles,
            ),
            externalIds: data.titleDetails.external_ids,
        }
    }

    createTitleUpdateDataFromTmdbResults(
        data: TmdbTitleDataDTO,
    ): Partial<Title> {
        const isMovie = data.type === TitleType.MOVIE
        const movieInfo = data.titleDetails as MovieResponse
        const showInfo = data.titleDetails as ShowResponse

        return {
            name: isMovie ? movieInfo.title : showInfo.name,
            originalName: isMovie
                ? movieInfo.original_title
                : showInfo.original_name,
            imdbId: data.imdbId || data.existingTitle.imdbId,
            category: data.category,
            status: this.mapTitleStatus(data.titleDetails.status),
            isAdult: movieInfo.adult || false,
            posterPath: data.title.poster_path,
            backdropPath: data.title.backdrop_path,
            popularity: data.title.popularity,
            overview: this.processOverview(
                data.titleDetails.overview,
                data.titleDetails.translations,
                this.defaultTmdbLanguage,
            ),
            details: this.extractBasicDetails(data.titleDetails),
            images: data.titleDetails.images,
            keywords: data.titleDetails.keywords,
            credits: data.titleDetails.credits,
            alternativeTitles: this.extractAlternativeTitles(
                data.titleDetails.alternative_titles,
            ),
            externalIds: data.titleDetails.external_ids,
        }
    }

    extractBasicTitleInfo(
        titleDetails: TmdbTitleExtendedResponse,
    ): Partial<TmdbTitleResponse> {
        const isMovie = 'budget' in titleDetails
        const movieInfo = titleDetails as ExtendedMovieResponse
        const showInfo = titleDetails as ExtendedShowResponse

        return {
            id: titleDetails.id,
            title: isMovie ? movieInfo.title : undefined,
            name: isMovie ? undefined : showInfo.name,
            original_title: isMovie ? movieInfo.original_title : undefined,
            original_name: isMovie ? undefined : showInfo.original_name,
            adult: isMovie ? movieInfo.adult : false,
            poster_path: titleDetails.poster_path,
            backdrop_path: titleDetails.backdrop_path,
            popularity: titleDetails.popularity,
        }
    }

    extractBasicDetails(titleDetails: TmdbTitleExtendedResponse): TitleDetails {
        const isMovie = 'budget' in titleDetails
        const movieInfo = titleDetails as ExtendedMovieResponse
        const showInfo = titleDetails as ExtendedShowResponse

        return {
            budget: isMovie ? movieInfo.budget : null,
            revenue: isMovie ? movieInfo.revenue : null,
            runtime: isMovie ? movieInfo.runtime : showInfo.episode_run_time[0],
            tagline: titleDetails.tagline,
            homepage: titleDetails.homepage,
            vote_average: titleDetails.vote_average,
            vote_count: titleDetails.vote_count,
            release_date: isMovie
                ? movieInfo.release_date
                : showInfo.first_air_date,
        }
    }

    extractFullTitle(
        existingTitle: DbTitle,
        titleDetails: TmdbTitleExtendedResponse,
    ): Title {
        const basicTitleInfo = this.extractBasicTitleInfo(titleDetails)
        const basicTitleDetails = this.extractBasicDetails(titleDetails)
        const isMovie = 'budget' in titleDetails

        return {
            ...basicTitleInfo,
            ...basicTitleDetails,
            ...existingTitle,
            images: titleDetails.images,
            keywords: titleDetails.keywords,
            credits: {
                cast: titleDetails.credits.cast,
                crew: titleDetails.credits.crew,
            },
            alternativeTitles: isMovie
                ? (
                      titleDetails.alternative_titles as MovieAlternativeTitlesResponse
                  ).titles
                : (
                      titleDetails.alternative_titles as ShowAlternativeTitlesResponse
                  ).results,
            externalIds: titleDetails.external_ids,
        }
    }

    extractAlternativeTitles(
        alternativeTitles: TmdbTitleAlternativeTitlesResponse,
    ): TitleAlternativeTitle[] {
        const movieTitles = alternativeTitles as MovieAlternativeTitlesResponse
        const showTitles = alternativeTitles as ShowAlternativeTitlesResponse
        if (movieTitles?.titles) {
            return movieTitles.titles.map((t) => ({
                iso_3166_1: t.iso_3166_1,
                title: t.title,
                type: t.type,
            }))
        } else if (showTitles?.results) {
            return showTitles.results.map((t) => ({
                iso_3166_1: t.iso_3166_1,
                title: t.title,
                type: t.type,
            }))
        }
        return []
    }

    mapTitleStatus(status: string): TitleStatus {
        switch (status) {
            case 'Rumored':
                return TitleStatus.RUMORED
            case 'Planned':
                return TitleStatus.PLANNED
            case 'In Production':
                return TitleStatus.IN_PRODUCTION
            case 'Post Production':
                return TitleStatus.POST_PRODUCTION
            case 'Released':
                return TitleStatus.RELEASED
            case 'Canceled':
                return TitleStatus.CANCELED
            case 'Airing':
            case 'Returning Series':
                return TitleStatus.AIRING
            default:
                return TitleStatus.RELEASED
        }
    }

    processOverview(
        overview: string,
        translations: CollectionTranslationsResponse,
        defaultLanguage: string,
    ): any {
        if (!translations || !translations.translations) {
            return { [defaultLanguage.substring(0, 2)]: overview }
        }

        const result = {}
        const supportedLanguages = ['en', 'ru']

        result[defaultLanguage.substring(0, 2)] = overview

        for (const translation of translations.translations) {
            const langCode = translation.iso_639_1
            if (
                supportedLanguages.includes(langCode) &&
                translation.data?.overview
            ) {
                result[langCode] = translation.data.overview
            }
        }

        return result
    }
}
