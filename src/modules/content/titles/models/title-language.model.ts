import { Field, ObjectType } from '@nestjs/graphql'
import { TitleLanguageType } from '../enums/title-language-type.enum'
import { Title } from './title.model'

@ObjectType()
export class Language {
    @Field(() => String)
    id: string

    @Field(() => String)
    iso: string

    @Field(() => String)
    name: string

    @Field(() => String)
    englishName: string

    @Field(() => [TitleLanguage])
    titleLanguages: TitleLanguage[]
}

@ObjectType()
export class TitleLanguage {
    @Field(() => String)
    titleId: string

    @Field(() => String)
    languageId: string

    @Field(() => TitleLanguageType)
    type: TitleLanguageType

    @Field(() => Title)
    title: Title

    @Field(() => Language)
    language: Language
}
