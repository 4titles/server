import { Field, InputType, Int } from '@nestjs/graphql'
import {
    IsBoolean,
    IsEnum,
    IsInt,
    IsOptional,
    IsString,
    Min,
} from 'class-validator'
import { CollectionSortType } from '../enums/collection-sort.enum'
import { CollectionType } from '../enums/collection-type.enum'

@InputType()
export class FindCollectionsInput {
    @Field(() => Int, { defaultValue: 10, nullable: true })
    @IsOptional()
    @IsInt()
    @Min(1)
    take?: number

    @Field(() => Int, { defaultValue: 0, nullable: true })
    @IsOptional()
    @IsInt()
    @Min(0)
    skip?: number

    @Field(() => CollectionType, { nullable: true })
    @IsOptional()
    @IsEnum(CollectionType)
    type?: CollectionType

    @Field(() => Boolean, { defaultValue: false, nullable: true })
    @IsOptional()
    @IsBoolean()
    mine?: boolean

    @Field(() => CollectionSortType, {
        defaultValue: CollectionSortType.RECENTLY_ADDED,
        nullable: true,
    })
    @IsOptional()
    @IsEnum(CollectionSortType)
    sort?: CollectionSortType

    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    search?: string
}
