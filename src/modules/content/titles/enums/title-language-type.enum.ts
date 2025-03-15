import { registerEnumType } from '@nestjs/graphql'

export enum TitleLanguageType {
    ORIGINAL = 'original',
    SPOKEN = 'spoken',
    AVAILABLE = 'available',
}

registerEnumType(TitleLanguageType, {
    name: 'TitleLanguageType',
})
