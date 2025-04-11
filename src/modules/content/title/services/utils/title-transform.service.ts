import { DbTitle } from '@/modules/infrastructure/drizzle/schema/titles.schema'
import { Injectable } from '@nestjs/common'
import { TitleStatus } from '../../enums/title-status.enum'
import {
    Title,
    TitleAlternativeTitle,
    TitleCredits,
    TitleDetails,
    TitleExternalIds,
    TitleImages,
    TitleKeyword,
} from '../../models/title.model'
import {
    ExtendedMovieResponse,
    ExtendedShowResponse,
    TmdbTitleAlternativeTitlesResponse,
    TmdbTitleExtendedResponse,
    TmdbTitleResponse,
} from '../../modules/tmdb/types/tmdb.interface'
import { TitleSyncData } from '../../types/title-sync-data.interface'

@Injectable()
export class TitleTransformService {
    createTitleDataFromTmdbResults(data: TitleSyncData): Partial<Title> {
        return this.createBaseTitleData(data)
    }

    createTitleUpdateDataFromTmdbResults(data: TitleSyncData): Partial<Title> {
        const baseData = this.createBaseTitleData(data)
        return {
            ...baseData,
            updatedAt: new Date(),
            lastSyncedAt: new Date(),
        }
    }

    extractBasicTitleInfo(
        titleDetails: TmdbTitleExtendedResponse,
    ): Partial<TmdbTitleResponse> {
        const isMovie = this.isTitleMovie(titleDetails)

        return {
            id: titleDetails.id,
            title: isMovie
                ? (titleDetails as ExtendedMovieResponse).title
                : undefined,
            name: isMovie
                ? undefined
                : (titleDetails as ExtendedShowResponse).name,
            original_title: isMovie
                ? (titleDetails as ExtendedMovieResponse).original_title
                : undefined,
            original_name: isMovie
                ? undefined
                : (titleDetails as ExtendedShowResponse).original_name,
            adult: isMovie
                ? (titleDetails as ExtendedMovieResponse).adult
                : false,
            poster_path: titleDetails.poster_path,
            backdrop_path: titleDetails.backdrop_path,
            popularity: titleDetails.popularity,
            vote_average: titleDetails.vote_average,
            vote_count: titleDetails.vote_count,
        }
    }

    extractBasicDetails(titleDetails: TmdbTitleExtendedResponse): TitleDetails {
        const isMovie = this.isTitleMovie(titleDetails)
        const movieInfo = titleDetails as ExtendedMovieResponse
        const showInfo = titleDetails as ExtendedShowResponse

        return {
            budget: isMovie ? movieInfo.budget || null : null,
            revenue: isMovie ? movieInfo.revenue || null : null,
            runtime: isMovie
                ? movieInfo.runtime || null
                : showInfo.episode_run_time &&
                    showInfo.episode_run_time.length > 0
                  ? showInfo.episode_run_time[0]
                  : null,
            vote_average: titleDetails.vote_average || 0,
            vote_count: titleDetails.vote_count || 0,
            release_date: isMovie
                ? movieInfo.release_date || null
                : showInfo.first_air_date || null,
        }
    }

    extractAlternativeTitles(
        alternativeTitles: TmdbTitleAlternativeTitlesResponse,
    ): TitleAlternativeTitle[] {
        if (!alternativeTitles) return []

        const sourceTitles =
            'titles' in alternativeTitles
                ? alternativeTitles.titles
                : 'results' in alternativeTitles
                  ? alternativeTitles.results
                  : null

        if (!sourceTitles || !Array.isArray(sourceTitles)) return []

        return sourceTitles.map((item) => ({
            iso_3166_1: item.iso_3166_1 || '',
            title: 'title' in item ? item.title || '' : '',
            type: 'type' in item ? item.type || null : null,
        }))
    }

    extractFullTitle(
        existingTitle: DbTitle,
        titleDetails: TmdbTitleExtendedResponse,
    ): Title {
        const existingDetails = existingTitle.details || {}
        const basicTitleInfo = this.extractBasicTitleInfo(titleDetails)
        const basicDetails = this.extractBasicDetails(titleDetails)

        const titleImages: TitleImages | null = titleDetails.images || null
        const titleKeywords: TitleKeyword[] = titleDetails.keywords || []
        const titleCredits: TitleCredits = {
            cast: titleDetails.credits?.cast || [],
            crew: titleDetails.credits?.crew || [],
        }
        const titleExternalIds: TitleExternalIds | null =
            titleDetails.external_ids || null
        const titleAlternativeTitles: TitleAlternativeTitle[] =
            this.extractAlternativeTitles(titleDetails.alternative_titles)

        return {
            id: existingTitle.id,
            tmdbId: existingTitle.tmdbId,
            imdbId: existingTitle.imdbId || null,
            originalName: existingTitle.originalName || '',
            type: existingTitle.type,
            category: existingTitle.category,
            status: existingTitle.status,
            isAdult: existingTitle.isAdult || false,
            posterPath:
                existingTitle.posterPath || basicTitleInfo.poster_path || null,
            backdropPath:
                existingTitle.backdropPath ||
                basicTitleInfo.backdrop_path ||
                null,
            popularity:
                existingTitle.popularity || basicTitleInfo.popularity || 0,
            hasLocations: existingTitle.hasLocations || false,
            createdAt: existingTitle.createdAt,
            updatedAt: existingTitle.updatedAt,
            lastSyncedAt: existingTitle.lastSyncedAt,
            details: {
                ...existingDetails,
                ...basicDetails,
            },
            voteAverage:
                existingTitle.voteAverage || basicTitleInfo.vote_average || 0,
            voteCount:
                existingTitle.voteCount || basicTitleInfo.vote_count || 0,
            images: titleImages,
            keywords: titleKeywords,
            credits: titleCredits,
            alternativeTitles: titleAlternativeTitles,
            externalIds: titleExternalIds,
            translations: [],
            filmingLocations: [],
            comments: [],
            genres: [],
            languages: [],
            countries: [],
        }
    }

    mergeDbAndEsDetails(
        dbTitleWithRelations: DbTitle,
        esDetails: TmdbTitleExtendedResponse | null,
    ): Title {
        const title: Partial<Title> = {
            id: dbTitleWithRelations.id,
            tmdbId: dbTitleWithRelations.tmdbId,
            imdbId: dbTitleWithRelations.imdbId,
            originalName: dbTitleWithRelations.originalName,
            type: dbTitleWithRelations.type,
            category: dbTitleWithRelations.category,
            status: dbTitleWithRelations.status,
            isAdult: dbTitleWithRelations.isAdult,
            posterPath: dbTitleWithRelations.posterPath,
            backdropPath: dbTitleWithRelations.backdropPath,
            popularity: dbTitleWithRelations.popularity,
            details: dbTitleWithRelations.details,
            hasLocations: dbTitleWithRelations.hasLocations,
            createdAt: dbTitleWithRelations.createdAt,
            updatedAt: dbTitleWithRelations.updatedAt,
            lastSyncedAt: dbTitleWithRelations.lastSyncedAt,
            genres: (dbTitleWithRelations as any).genres || [],
            countries: (dbTitleWithRelations as any).countries || [],
            languages: (dbTitleWithRelations as any).languages || [],
            translations: (dbTitleWithRelations as any).translations || [],
            images: (dbTitleWithRelations as any).images || {
                backdrops: [],
                posters: [],
                logos: [],
            },
            filmingLocations:
                (dbTitleWithRelations as any).filmingLocations || [],
            comments: (dbTitleWithRelations as any).comments || [],
        }

        if (esDetails) {
            const basicDetailsFromEs = this.extractBasicDetails(esDetails)
            title.details = {
                ...(dbTitleWithRelations.details || {}),
                ...basicDetailsFromEs,
            }

            const keywordsResponse = esDetails.keywords
            if (keywordsResponse && 'keywords' in keywordsResponse) {
                title.keywords = Array.isArray(keywordsResponse.keywords)
                    ? keywordsResponse.keywords
                    : []
            } else if (Array.isArray(keywordsResponse)) {
                title.keywords = keywordsResponse
            } else {
                title.keywords = []
            }

            title.credits = {
                cast: esDetails.credits?.cast || [],
                crew: esDetails.credits?.crew || [],
            }
            title.alternativeTitles = this.extractAlternativeTitles(
                esDetails.alternative_titles,
            )
            title.externalIds = esDetails.external_ids || null

            if (
                !(
                    title.images &&
                    (title.images.backdrops?.length > 0 ||
                        title.images.posters?.length > 0 ||
                        title.images.logos?.length > 0)
                )
            ) {
                title.images = esDetails.images || {
                    backdrops: [],
                    posters: [],
                    logos: [],
                }
            }
        } else {
            title.details = dbTitleWithRelations.details || {}
            title.keywords = []
            title.credits = { cast: [], crew: [] }
            title.alternativeTitles = []
            title.externalIds = null
        }

        return title as Title
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

    private isTitleMovie(details: TmdbTitleExtendedResponse): boolean {
        return 'budget' in details || 'release_date' in details
    }

    private createBaseTitleData(data: TitleSyncData): Partial<Title> {
        const { title, titleDetails, type, category, imdbId } = data
        const isMovie = this.isTitleMovie(titleDetails)
        const details = this.extractBasicDetails(titleDetails)

        return {
            tmdbId: String(title.id),
            imdbId: imdbId || null,
            originalName: isMovie
                ? (titleDetails as ExtendedMovieResponse).original_title
                : (titleDetails as ExtendedShowResponse).original_name,
            type,
            category,
            status: this.mapTitleStatus(titleDetails.status),
            isAdult: isMovie
                ? (titleDetails as ExtendedMovieResponse).adult || false
                : false,
            posterPath: title.poster_path || null,
            backdropPath: title.backdrop_path || null,
            popularity: title.popularity || 0,
            details,
            voteCount: details.vote_count || 0,
            voteAverage: details.vote_average || 0.0,
            releaseDate: new Date(details.release_date) || null,
            images: titleDetails.images || null,
            keywords: titleDetails.keywords || [],
            credits: {
                cast: titleDetails.credits?.cast || [],
                crew: titleDetails.credits?.crew || [],
            },
            alternativeTitles: this.extractAlternativeTitles(
                titleDetails.alternative_titles,
            ),
            externalIds: titleDetails.external_ids || null,
        }
    }
}
