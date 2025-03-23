import {
    CollectionTranslationsResponse,
    CreditsResponse,
    KeywordResponse,
    MovieAlternativeTitlesResponse,
    MovieExternalIdsResponse,
    MovieImagesResponse,
    MovieRecommendationsResponse,
    MovieResponse,
    MovieResultsResponse,
    ShowAlternativeTitlesResponse,
    ShowResponse,
    SimilarMovieResponse,
    TrendingResponse,
    TvExternalIdsResponse,
    TvImagesResponse,
    TvResultsResponse,
    TvSimilarShowsResponse,
} from 'moviedb-promise'

export type TmdbTitleResponse = MovieResponse | ShowResponse

export type TmdbCategoryResponse =
    | MovieResultsResponse
    | TvResultsResponse
    | TrendingResponse

export type TmdbTitleRecommendationsResponse =
    | MovieRecommendationsResponse
    | TvResultsResponse

export type TmdbTitleSimilarResponse =
    | SimilarMovieResponse
    | TvSimilarShowsResponse

export type TmdbTitleExtendedResponse =
    | ExtendedMovieResponse
    | ExtendedShowResponse

export type TmdbTitleAlternativeTitlesResponse =
    | MovieAlternativeTitlesResponse
    | ShowAlternativeTitlesResponse

export interface TmdbResponse {
    results: TmdbTitleResponse[]
    total_pages: number
    total_results: number
    page: number
}

export type TmdbImages = MovieImagesResponse | TvImagesResponse
export type TmdbExternalIds = MovieExternalIdsResponse | TvExternalIdsResponse

export interface ExtendedMovieResponse extends MovieResponse {
    credits: CreditsResponse
    recommendations: MovieRecommendationsResponse
    similar: SimilarMovieResponse
    keywords: KeywordResponse
    alternative_titles: TmdbTitleAlternativeTitlesResponse
    translations: CollectionTranslationsResponse
    external_ids: TmdbExternalIds
    images: MovieImagesResponse
}

export interface ExtendedShowResponse extends ShowResponse {
    credits: CreditsResponse
    recommendations: TvResultsResponse
    similar: TvSimilarShowsResponse
    keywords: KeywordResponse
    alternative_titles: TmdbTitleAlternativeTitlesResponse
    translations: CollectionTranslationsResponse
    external_ids: TmdbExternalIds
    images: TvImagesResponse
}
