import { Field, ObjectType } from '@nestjs/graphql'
import { User } from './user.model'

@ObjectType()
export class AuthModel {
    @Field(() => User, { nullable: true })
    user?: User

    @Field(() => String, { nullable: true })
    message?: string
}
