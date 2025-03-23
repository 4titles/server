import { Field, ObjectType } from '@nestjs/graphql'
import { TitleLanguage } from '../../../models/title-language.model'

@ObjectType()
export class Language {
    @Field(() => String)
    id: string

    @Field(() => String)
    iso: string

    @Field(() => String)
    nativeName: string

    @Field(() => String)
    englishName: string

    @Field(() => [TitleLanguage], { nullable: true })
    titles?: TitleLanguage[]
}
