import {
    IsArray,
    IsEnum,
    IsNotEmpty,
    IsOptional,
    IsString,
    IsUUID,
} from 'class-validator'
import { TitleType } from '../../../enums/title-type.enum'

export class LocationDescriptionDto {
    @IsUUID()
    @IsNotEmpty()
    titleId: string

    @IsUUID()
    @IsNotEmpty()
    locationId: string

    @IsString()
    @IsNotEmpty()
    titleName: string

    @IsNotEmpty()
    @IsEnum(TitleType)
    titleType: TitleType

    @IsString()
    @IsOptional()
    titleYear: string

    @IsArray()
    @IsString({ each: true })
    titleGenres: string[]

    @IsString()
    @IsOptional()
    titlePlot?: string

    @IsString()
    @IsNotEmpty()
    locationAddress: string

    @IsString()
    @IsOptional()
    locationCity?: string

    @IsString()
    @IsOptional()
    locationState?: string

    @IsString()
    @IsNotEmpty()
    locationCountry: string

    @IsString()
    @IsOptional()
    language?: string

    constructor(data: Partial<LocationDescriptionDto> = {}) {
        Object.assign(this, data)
    }
}
