import { Field, ObjectType } from '@nestjs/graphql'

@ObjectType()
export class TitleConfigDataSyncResult {
    @Field(() => Number)
    syncedCountriesCount: number

    @Field(() => Number)
    syncedLanguagesCount: number

    @Field(() => Number)
    syncedGenresCount: number
}
