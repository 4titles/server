import { Field, Int, ObjectType } from '@nestjs/graphql'
import { Comment } from '../../comment/models/comment.model'
import { TitleCategory } from '../enums/title-category.enum'
import { TitleStatus } from '../enums/title-status.enum'
import { TitleType } from '../enums/title-type.enum'
import { Language } from '../modules/language/models/language.model'
import { TitleCountry } from './title-country.model'
import { TitleFilmingLocation } from './title-filming-location.model'
import { TitleGenre } from './title-genre.model'
import { TitleLanguage } from './title-language.model'

@ObjectType()
export class TitleDetails {
    @Field(() => Number, { nullable: true })
    budget?: number

    @Field(() => Number, { nullable: true })
    revenue?: number

    @Field(() => Number, { nullable: true })
    runtime?: number

    @Field(() => Number, { nullable: true })
    vote_average?: number

    @Field(() => Number, { nullable: true })
    vote_count?: number

    @Field(() => String, { nullable: true })
    release_date?: string
}

@ObjectType()
export class TitleImage {
    @Field(() => Number, { nullable: true })
    aspect_ratio?: number

    @Field(() => Number, { nullable: true })
    height?: number

    @Field(() => Number, { nullable: true })
    width?: number

    @Field(() => String, { nullable: true })
    iso_639_1?: string

    @Field(() => String, { nullable: true })
    file_path?: string

    @Field(() => Number, { nullable: true })
    vote_average?: number

    @Field(() => Number, { nullable: true })
    vote_count?: number
}

@ObjectType()
export class TitleImages {
    @Field(() => [TitleImage])
    backdrops?: TitleImage[]

    @Field(() => [TitleImage])
    logos?: TitleImage[]

    @Field(() => [TitleImage])
    posters?: TitleImage[]
}

@ObjectType()
export class TitleKeyword {
    @Field(() => Number, { nullable: true })
    id?: number

    @Field(() => String, { nullable: true })
    name?: string
}

@ObjectType()
export class TitleAlternativeTitle {
    @Field(() => String, { nullable: true })
    iso_3166_1?: string

    @Field(() => String, { nullable: true })
    title?: string

    @Field(() => String, { nullable: true })
    type?: string
}

@ObjectType()
export class TitleCredit {
    @Field(() => Number, { nullable: true })
    id?: number

    @Field(() => Boolean, { nullable: true })
    adult?: boolean

    @Field(() => Number, { nullable: true })
    gender?: number

    @Field(() => String, { nullable: true })
    known_for_department?: string

    @Field(() => String, { nullable: true })
    name?: string

    @Field(() => String, { nullable: true })
    original_name?: string

    @Field(() => Number, { nullable: true })
    popularity?: number

    @Field(() => String, { nullable: true })
    profile_path?: string

    @Field(() => String, { nullable: true })
    character?: string

    @Field(() => String, { nullable: true })
    credit_id?: string

    @Field(() => Number, { nullable: true })
    order?: number
}

@ObjectType()
export class TitleCredits {
    @Field(() => [TitleCredit], { nullable: true })
    cast?: TitleCredit[]
    @Field(() => [TitleCredit], { nullable: true })
    crew?: TitleCredit[]
}

@ObjectType()
export class TitleExternalIds {
    @Field(() => String, { nullable: true })
    imdb_id?: string

    @Field(() => String, { nullable: true })
    freebase_mid?: string

    @Field(() => String, { nullable: true })
    freebase_id?: string

    @Field(() => Number, { nullable: true })
    tvdb_id?: number

    @Field(() => Number, { nullable: true })
    tvrage_id?: number

    @Field(() => String, { nullable: true })
    wikidata_id?: string

    @Field(() => String, { nullable: true })
    facebook_id?: string

    @Field(() => String, { nullable: true })
    instagram_id?: string

    @Field(() => String, { nullable: true })
    twitter_id?: string
}

@ObjectType()
export class TitleTranslation {
    @Field(() => String, { nullable: true })
    id?: string

    @Field(() => String)
    titleId?: string

    @Field(() => String)
    languageId?: string

    @Field(() => String)
    title?: string

    @Field(() => String, { nullable: true })
    overview?: string

    @Field(() => String, { nullable: true })
    tagline?: string

    @Field(() => String, { nullable: true })
    homepage?: string

    @Field(() => Int, { nullable: true })
    runtime?: number

    @Field(() => Language, { nullable: true })
    language?: Language
}

@ObjectType()
export class TitleProductionCompany {
    @Field(() => String, { nullable: true })
    id?: number

    @Field(() => String, { nullable: true })
    name?: string

    @Field(() => String, { nullable: true })
    logo_path?: string

    @Field(() => String, { nullable: true })
    origin_country?: string
}

@ObjectType()
export class Title {
    @Field(() => String)
    id: string

    @Field(() => String)
    tmdbId: string

    @Field(() => String, { nullable: true })
    imdbId?: string

    @Field(() => String, { nullable: true })
    originalName?: string

    @Field(() => String, { nullable: true })
    slug?: string

    @Field(() => TitleType)
    type: TitleType

    @Field(() => TitleCategory)
    category: TitleCategory

    @Field(() => TitleStatus)
    status: TitleStatus

    @Field(() => Boolean)
    isAdult: boolean

    @Field(() => Number)
    popularity: number

    @Field(() => Boolean)
    hasLocations: boolean

    @Field(() => String, { nullable: true })
    releaseDate?: Date

    @Field(() => Number, { nullable: true })
    budget?: number

    @Field(() => Number, { nullable: true })
    revenue?: number

    @Field(() => Number, { nullable: true })
    runtime?: number

    @Field(() => Number, { nullable: true })
    voteAverage?: number

    @Field(() => Number, { nullable: true })
    voteCount?: number

    @Field(() => [TitleKeyword], { nullable: true })
    keywords?: TitleKeyword[]

    @Field(() => TitleCredits, { nullable: true })
    credits?: TitleCredits

    @Field(() => [TitleAlternativeTitle], { nullable: true })
    alternativeTitles?: TitleAlternativeTitle[]

    @Field(() => TitleExternalIds, { nullable: true })
    externalIds?: TitleExternalIds

    @Field(() => [TitleProductionCompany], { nullable: true })
    productionCompanies?: TitleProductionCompany[]

    @Field(() => Date)
    createdAt: Date

    @Field(() => Date)
    updatedAt: Date

    @Field(() => Date, { nullable: true })
    lastSyncedAt?: Date

    @Field(() => [TitleFilmingLocation])
    filmingLocations?: TitleFilmingLocation[]

    @Field(() => [Comment])
    comments: Comment[]

    @Field(() => [TitleGenre])
    genres: TitleGenre[]

    @Field(() => [TitleLanguage])
    languages: TitleLanguage[]

    @Field(() => [TitleCountry])
    countries: TitleCountry[]

    @Field(() => [TitleTranslation])
    translations: TitleTranslation[]

    @Field(() => TitleImages, { nullable: true })
    images?: TitleImages
}
