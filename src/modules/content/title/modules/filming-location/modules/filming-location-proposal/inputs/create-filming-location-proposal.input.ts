import { Field, InputType } from '@nestjs/graphql'
import {
    IsEnum,
    IsNotEmpty,
    IsObject,
    IsOptional,
    IsString,
    IsUUID,
    MaxLength,
    MinLength,
} from 'class-validator'
import { Point } from '../../../models/filming-location.model'
import { FilmingLocationProposalType } from '../enums/filming-location-proposal-type.enum'

@InputType()
class PointInput implements Point {
    @Field()
    @IsNotEmpty({ message: 'Coordinate X cannot be empty' })
    x: number

    @Field()
    @IsNotEmpty({ message: 'Coordinate X cannot be empty' })
    y: number
}

@InputType()
export class CreateFilmingLocationProposalInput {
    @Field(() => FilmingLocationProposalType)
    @IsEnum(FilmingLocationProposalType, {
        message: 'Filming location proposal should have a valid type',
    })
    type: FilmingLocationProposalType

    @Field(() => String)
    @IsUUID('4')
    titleId: string

    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsUUID('4')
    locationId?: string

    @Field(() => String)
    @IsString()
    @IsNotEmpty({
        message: 'Filming location proposal address cannot be empty',
    })
    @MinLength(5, {
        message:
            'Filming location proposal address must have at least 5 characters',
    })
    @MaxLength(255, {
        message:
            'Filming location proposal address must not exceed 255 characters',
    })
    address: string

    @Field(() => PointInput, { nullable: true })
    @IsOptional()
    @IsObject()
    coordinates?: PointInput

    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    @MaxLength(1000, {
        message:
            'Filming location proposal description must not exceed 1000 characters',
    })
    description?: string

    @Field(() => String)
    @IsString()
    @IsNotEmpty({ message: 'Filming location proposal reason cannot be empty' })
    @MinLength(10, {
        message:
            'Filming location proposal reason must contain at least 10 characters',
    })
    @MaxLength(500, {
        message:
            'Filming location proposal reason must not exceed 500 characters',
    })
    reason: string
}
