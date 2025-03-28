import { registerEnumType } from '@nestjs/graphql'

export enum TitleSupportedLanguage {
    EN = 'en',
    RU = 'ru',
    ES = 'es',
    FR = 'fr',
    DE = 'de',
    IT = 'it',
    ZH = 'zh',
    JA = 'ja',
    PT = 'pt',
    KO = 'ko',
    TR = 'tr',
    HI = 'hi',
    TH = 'th',
    ID = 'id',
}

registerEnumType(TitleSupportedLanguage, { name: 'TitleSupportedLanguage' })
