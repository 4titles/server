import { registerEnumType } from '@nestjs/graphql'

export enum MovieLanguageType {
    ORIGINAL = 'original',
    SPOKEN = 'spoken',
}

registerEnumType(MovieLanguageType, {
    name: 'MovieLanguageType',
})
