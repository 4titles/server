import { User } from '@/modules/auth/account/models/user.model'
import { Field, ObjectType, registerEnumType } from '@nestjs/graphql'
import { NotificationType } from '../enums/notification-type.enum'

registerEnumType(NotificationType, {
    name: 'NotificationType',
})

@ObjectType()
export class Notification {
    @Field(() => String)
    id: string

    @Field(() => String)
    message: string

    @Field(() => NotificationType)
    type: NotificationType

    @Field(() => Boolean)
    isRead: boolean

    @Field(() => Boolean)
    isGlobal: boolean

    @Field(() => User, { nullable: true })
    user?: User

    @Field(() => String, { nullable: true })
    userId?: string

    @Field(() => Date)
    createdAt: Date

    @Field(() => Date)
    updatedAt: Date
}
