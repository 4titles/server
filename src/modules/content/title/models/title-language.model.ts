import { Field, ObjectType } from '@nestjs/graphql'
import { TitleLanguageType } from '../enums/title-language-type.enum'
import { Language } from '../modules/language/models/language.model'
import { Title } from './title.model'

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
