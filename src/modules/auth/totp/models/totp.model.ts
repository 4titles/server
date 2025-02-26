import { Field, ObjectType } from '@nestjs/graphql'

@ObjectType()
export class TotpModel {
    @Field(() => String)
    qrCodeUrl: string

    @Field(() => String)
    secret: string
}
