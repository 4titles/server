import { registerEnumType } from '@nestjs/graphql'

export enum TitleImageType {
    BACKDROP = 'backdrop',
    POSTER = 'poster',
    LOGO = 'logo',
}

registerEnumType(TitleImageType, { name: 'TitleImageType' })
