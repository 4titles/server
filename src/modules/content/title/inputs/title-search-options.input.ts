import { SearchOptions } from '@/shared/types/pagination.interface'
import { Field, InputType } from '@nestjs/graphql'
import { IsNumber, IsOptional, Max, Min } from 'class-validator'

@InputType()
export class TitleSearchOptionsInput implements SearchOptions {
    @Field(() => Number, { nullable: true, defaultValue: 0 })
    @IsOptional()
    @IsNumber()
    @Min(0)
    from: number = 0

    @Field(() => Number, { nullable: true, defaultValue: 10 })
    @IsOptional()
    @IsNumber()
    @Min(1)
    @Max(100)
    size: number = 10
}
