import { DbTitle } from '@/modules/infrastructure/drizzle/schema/titles.schema'
import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import {
    CollectionTranslationsResponse,
    MovieResponse,
    ShowResponse,
} from 'moviedb-promise'
import { TitleCategory } from '../../enums/title-category.enum'
import { TitleStatus } from '../../enums/title-status.enum'
import { TitleType } from '../../enums/title-type.enum'
import { TitleDetails } from '../../models/title-details.model'
import { Title } from '../../models/title.model'
import {
    ExtendedMovieResponse,
    ExtendedShowResponse,
    TmdbTitleExtendedResponse,
    TmdbTitleResponse,
} from '../../modules/tmdb/types/tmdb.interface'

@Injectable()
export class TitleTransformService {
    private readonly defaultTmdbLanguage: string
    private readonly titleOverviewLanguages: string[]

    constructor(private readonly configService: ConfigService) {
        this.defaultTmdbLanguage =
            this.configService.get<string>('tmdb.defaultLanguage') || 'ru'
        this.titleOverviewLanguages = ['en', 'ru']
    }

    createTitleData(
        result: MovieResponse | ShowResponse,
        detailedInfo: TmdbTitleExtendedResponse,
        type: TitleType,
        category: TitleCategory,
        imdbId: string | null,
    ): Partial<Title> {
        const isMovie = type === TitleType.MOVIE
        const movieInfo = detailedInfo as MovieResponse
        const showInfo = detailedInfo as ShowResponse

        return {
            tmdbId: String(result.id),
            imdbId: imdbId || null,
            name: isMovie ? movieInfo.title : (result as ShowResponse).name,
            originalName: isMovie
                ? movieInfo.original_title
                : showInfo.original_name,
            type,
            category,
            status: this.mapTitleStatus(detailedInfo.status),
            isAdult: movieInfo.adult || false,
            posterPath: result.poster_path,
            backdropPath: result.backdrop_path,
            popularity: result.popularity,
            overview: this.processOverview(
                detailedInfo.overview,
                detailedInfo.translations,
                this.defaultTmdbLanguage,
            ),
            details: this.extractBasicDetails(detailedInfo),
            needsLocationUpdate: !!imdbId,
            lastSyncedAt: new Date(),
        }
    }

    createTitleUpdateData(
        result: MovieResponse | ShowResponse,
        detailedInfo: TmdbTitleExtendedResponse,
        type: TitleType,
        category: TitleCategory,
        imdbId: string | null,
        existingTitle: DbTitle,
        needsLocationUpdate?: boolean,
    ): Partial<Title> {
        const isMovie = type === TitleType.MOVIE
        const movieInfo = detailedInfo as MovieResponse
        const showInfo = detailedInfo as ShowResponse

        return {
            name: isMovie ? movieInfo.title : showInfo.name,
            originalName: isMovie
                ? movieInfo.original_title
                : showInfo.original_name,
            imdbId: imdbId || existingTitle.imdbId,
            category,
            status: this.mapTitleStatus(detailedInfo.status),
            isAdult: movieInfo.adult || false,
            posterPath: result.poster_path,
            backdropPath: result.backdrop_path,
            popularity: result.popularity,
            overview: this.processOverview(
                detailedInfo.overview,
                detailedInfo.translations,
                this.defaultTmdbLanguage,
            ),
            details: this.extractBasicDetails(detailedInfo),
            needsLocationUpdate:
                needsLocationUpdate || existingTitle.needsLocationUpdate,
            lastSyncedAt: new Date(),
        }
    }

    extractBasicTitleInfo(
        detailedInfo: TmdbTitleExtendedResponse,
    ): Partial<TmdbTitleResponse> {
        const isMovie = 'budget' in detailedInfo
        const movieInfo = detailedInfo as ExtendedMovieResponse
        const showInfo = detailedInfo as ExtendedShowResponse

        return {
            id: detailedInfo.id,
            title: isMovie ? movieInfo.title : undefined,
            name: isMovie ? undefined : showInfo.name,
            original_title: isMovie ? movieInfo.original_title : undefined,
            original_name: isMovie ? undefined : showInfo.original_name,
            adult: isMovie ? movieInfo.adult : false,
            poster_path: detailedInfo.poster_path,
            backdrop_path: detailedInfo.backdrop_path,
            popularity: detailedInfo.popularity,
        }
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

        result[defaultLanguage.substring(0, 2)] = overview

        for (const translation of translations.translations) {
            const langCode = translation.iso_639_1
            if (
                this.titleOverviewLanguages.includes(langCode) &&
                translation.data &&
                translation.data.overview
            ) {
                result[langCode] = translation.data.overview
            }
        }

        return result
    }

    extractBasicDetails(detailedInfo: TmdbTitleExtendedResponse): TitleDetails {
        const isMovie = 'budget' in detailedInfo
        const movieInfo = detailedInfo as ExtendedMovieResponse
        const showInfo = detailedInfo as ExtendedShowResponse

        return {
            budget: isMovie ? movieInfo.budget : null,
            revenue: isMovie ? movieInfo.revenue : null,
            runtime: isMovie ? movieInfo.runtime : showInfo.episode_run_time[0],
            tagline: detailedInfo.tagline,
            homepage: detailedInfo.homepage,
            vote_average: detailedInfo.vote_average,
            vote_count: detailedInfo.vote_count,
            release_date: isMovie
                ? movieInfo.release_date
                : showInfo.first_air_date,
        }
    }
}
