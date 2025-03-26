import { DbTitle } from '@/modules/infrastructure/drizzle/schema/titles.schema'
import {
    IsEnum,
    IsNotEmpty,
    IsObject,
    IsOptional,
    IsString,
} from 'class-validator'
import { TitleCategory } from '../enums/title-category.enum'
import { TitleType } from '../enums/title-type.enum'
import {
    TmdbTitleExtendedResponse,
    TmdbTitleResponse,
} from '../modules/tmdb/types/tmdb.interface'

export class TmdbTitleDataDTO {
    @IsNotEmpty()
    @IsObject()
    title: TmdbTitleResponse

    @IsNotEmpty()
    @IsObject()
    titleDetails: TmdbTitleExtendedResponse

    @IsNotEmpty()
    @IsEnum(TitleType)
    type: TitleType

    @IsNotEmpty()
    @IsEnum(TitleCategory)
    category: TitleCategory

    @IsOptional()
    @IsString()
    imdbId: string | null

    @IsOptional()
    @IsObject()
    existingTitle?: DbTitle
}
