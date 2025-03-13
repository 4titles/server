import {
    DeviceInfo,
    LocationInfo,
    SessionMetadata,
} from '@/shared/types/session-metadata.types'
import { Field, ID, ObjectType } from '@nestjs/graphql'

@ObjectType()
export class LocationCountryModel {
    @Field(() => String)
    ru: string

    @Field(() => String)
    en: string
}

@ObjectType()
export class LocationModel implements LocationInfo {
    @Field(() => LocationCountryModel)
    country: LocationCountryModel

    @Field(() => String)
    city: string

    @Field(() => Number)
    latidute: number

    @Field(() => Number)
    longitude: number

    @Field(() => String)
    region: string

    @Field(() => String)
    timezone: string
}

@ObjectType()
export class DeviceModel implements DeviceInfo {
    @Field(() => String)
    browser: string

    @Field(() => String)
    os: string

    @Field(() => String)
    type: string

    @Field(() => String)
    brand: string
}

@ObjectType()
export class SessionMetadataModel implements SessionMetadata {
    @Field(() => LocationModel)
    location: LocationModel

    @Field(() => DeviceModel)
    device: DeviceModel

    @Field(() => String)
    ip: string
}

@ObjectType()
export class Session {
    @Field(() => ID)
    id: string

    @Field(() => String)
    userId: string

    @Field(() => String)
    createdAt: Date

    @Field(() => SessionMetadataModel)
    metadata: SessionMetadataModel
}
