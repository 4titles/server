import { User } from '@/modules/auth/account/models/user.model'
import { Field, ObjectType } from '@nestjs/graphql'

@ObjectType()
export class NotificationSettings {
    @Field(() => String)
    id: string

    @Field(() => Boolean)
    isSiteNotificationsEnabled: boolean

    @Field(() => Boolean)
    isTelegramNotificationsEnabled: boolean

    @Field(() => User)
    user: User

    @Field(() => String)
    userId: string

    @Field(() => Date)
    createdAt: Date

    @Field(() => Date)
    updatedAt: Date
}

@ObjectType()
export class ChangeNotificationSettingsResponse {
    @Field(() => NotificationSettings)
    notificationSettings: NotificationSettings

    @Field(() => String, { nullable: true })
    telegramAuthToken?: string
}
