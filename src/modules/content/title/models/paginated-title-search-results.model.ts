import { PaginatedResult } from '@/shared/types/pagination.interface'
import { Field, ObjectType } from '@nestjs/graphql'
import { Title } from './title.model'

@ObjectType()
export class PaginatedTitleSearchResults implements PaginatedResult<Title> {
    @Field(() => [Title])
    items: Title[]

    @Field(() => Number)
    total: number

    @Field(() => Boolean)
    hasNextPage: boolean

    @Field(() => Boolean)
    hasPreviousPage: boolean
}
