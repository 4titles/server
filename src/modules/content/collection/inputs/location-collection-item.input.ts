import { Field, InputType, Int } from '@nestjs/graphql'
import { IsNotEmpty, IsOptional, IsUUID } from 'class-validator'

@InputType()
export class LocationCollectionItemInput {
    @Field(() => String)
    @IsNotEmpty()
    @IsUUID('4')
    locationId: string

    @Field(() => Int, { nullable: true })
    @IsOptional()
    position?: number
}
