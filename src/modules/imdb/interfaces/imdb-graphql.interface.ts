export interface IAvatar {
    url: string
    width: number
    height: number
}

export interface IPoster {
    url: string
    width: number
    height: number
    language_code: string | null
}

export interface IImage {
    url: string
    width: number
    height: number
    language_code?: string
}

export interface ICountry {
    code: string
    name: string
}

export interface ILanguage {
    code: string
    name: string
}

export interface IRating {
    aggregate_rating: number
    votes_count: number
}

export interface ICriticReview {
    score: number
    review_count: number
}

export interface ICertificate {
    country: ICountry
    rating: string
}

export interface INameBase {
    id: string
    display_name: string
    avatars?: IImage[]
}

export interface INameDetails extends INameBase {
    alternate_names?: string[]
    birth_year?: number
    birth_location?: string
    death_year?: number
    death_location?: string
    dead_reason?: string
    known_for?: {
        id: string
        primary_title: string
    }[]
}

export interface ICredit {
    name: INameDetails
    characters?: string[]
    episodes_count?: number
}

export interface IActorCreditData extends ICredit {
    characters?: string[]
}

export type CreditData = ICredit | IActorCreditData

export interface ICreditGroup {
    category: string
    persons: ICredit[]
}

export interface IIMDbTitle {
    id: string
    type: string
    is_adult: boolean
    primary_title: string
    original_title: string | null
    start_year: number
    end_year: number | null
    runtime_minutes: number | null
    plot: string
    rating: IRating
    genres: string[]
    posters: IPoster[]
    certificates: ICertificate[]
    spoken_languages: ILanguage[]
    origin_countries: ICountry[]
    critic_review: ICriticReview | null
    directors: ICredit[]
    writers: ICredit[]
    casts: ICredit[]
}

export interface IGraphQLVariables {
    [key: string]: any
}

export interface IIMDbGraphQLResponse {
    title: IIMDbTitle
}

export interface ITitlesResponse {
    titles: IIMDbTitle[]
}

export interface INameResponse {
    name: INameDetails
}
