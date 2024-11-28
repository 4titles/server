import {
    IsString,
    IsOptional,
    IsEnum,
    IsArray,
    IsNumber,
    IsUrl,
} from 'class-validator'
import { TitleType } from 'src/modules/titles/entities/title.entity'

export class TitleCreationDTO {
    @IsString()
    titleName: string

    @IsString()
    imdbid: string

    @IsEnum(TitleType)
    type: TitleType

    @IsOptional()
    @IsNumber()
    rank?: number

    @IsOptional()
    @IsString()
    image?: string

    @IsOptional()
    @IsString()
    description?: string

    @IsArray()
    genre: string[]

    @IsOptional()
    @IsNumber()
    rating?: number

    @IsOptional()
    @IsUrl()
    imdbLink?: string

    @IsOptional()
    @IsString()
    year?: string
}
