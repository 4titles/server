import {
    Backdrop,
    CollectionTranslationsResponse,
    CreditsResponse,
    KeywordResponse,
    MovieAlternativeTitlesResponse,
    MovieChangesResponse,
    MovieExternalIdsResponse,
    MovieImagesResponse,
    MovieRecommendationsResponse,
    MovieResponse,
    MovieResultsResponse,
    Poster,
    Response,
    ShowAlternativeTitlesResponse,
    ShowChangesResponse,
    ShowResponse,
    SimilarMovieResponse,
    TitleLogo,
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

export type TmdbTitleChangesResponse =
    | MovieChangesResponse
    | ShowChangesResponse

export interface TmdbResponse {
    results: TmdbTitleResponse[]
    total_pages: number
    total_results: number
    page: number
}

export type TmdbTitleImage = Backdrop | TitleLogo | Poster
export type TmdbImages = MovieImagesResponse | TvImagesResponse
export type TmdbTitleImages =
    | TmdbImages['backdrops']
    | TmdbImages['posters']
    | TmdbImages['logos']

export type TmdbExternalIds = MovieExternalIdsResponse | TvExternalIdsResponse

export interface ExtendedMovieResponse extends MovieResponse {
    credits: CreditsResponse
    keywords: KeywordResponse[]
    alternative_titles: MovieAlternativeTitlesResponse
    translations: TmdbTranslationsResponse
    external_ids: TmdbExternalIds
    images: MovieImagesResponse
}

export interface ExtendedShowResponse extends ShowResponse {
    credits: CreditsResponse
    keywords: KeywordResponse[]
    alternative_titles: ShowAlternativeTitlesResponse
    translations: TmdbTranslationsResponse
    external_ids: TmdbExternalIds
    images: TvImagesResponse
}

export interface TmdbTranslationsResponse extends Response {
    id?: number
    translations?: TmdbTranslation[]
}

export interface TmdbTranslation {
    iso_3166_1?: string
    iso_639_1?: string
    name?: string
    english_name?: string
    data?: {
        title?: string
        name?: string
        overview?: string
        homepage?: string
        tagline?: string
        runtime?: number
    }
}
