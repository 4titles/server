import { registerEnumType } from '@nestjs/graphql'

export enum CountryRelation {
    PRODUCTION = 'production',
    ORIGIN = 'origin',
}

registerEnumType(CountryRelation, {
    name: 'CountryRelation',
})
