import { registerEnumType } from '@nestjs/graphql'

export enum SeriesLanguageType {
    ORIGINAL = 'original',
    SPOKEN = 'spoken',
    AVAILABLE = 'available',
}

registerEnumType(SeriesLanguageType, {
    name: 'SeriesLanguageType',
})
