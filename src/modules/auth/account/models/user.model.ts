import { Follow } from '@/modules/content/follow/models/follow.model'
import { NotificationSettings } from '@/modules/infrastructure/notification/models/notification-settings.model'
import { Notification } from '@/modules/infrastructure/notification/models/notification.model'
import { Field, ObjectType } from '@nestjs/graphql'
import { SocialLink } from '../../profile/models/social-link.model'
import { Role } from '../../rbac/models/role.model'

@ObjectType()
export class User {
    @Field(() => String)
    id: string

    @Field(() => String)
    email: string

    @Field(() => String)
    password: string

    @Field(() => String)
    username: string

    @Field(() => String, { nullable: true })
    displayName?: string

    @Field(() => String, { nullable: true })
    avatar?: string

    @Field(() => String, { nullable: true })
    bio?: string

    @Field(() => String, { nullable: true })
    telegramId?: string

    @Field(() => Boolean)
    isVerified: boolean

    @Field(() => Boolean)
    isTotpEnabled: boolean

    @Field(() => String, { nullable: true })
    totpSecret?: string

    @Field(() => Boolean)
    isDeactivated: boolean

    @Field(() => Date, { nullable: true })
    deactivatedAt?: Date

    @Field(() => Date, { nullable: true })
    emailVerifiedAt?: Date

    @Field(() => Date)
    createdAt: Date

    @Field(() => Date)
    updatedAt: Date

    @Field(() => [SocialLink])
    socialLinks?: SocialLink[]

    @Field(() => [Notification])
    notifications?: Notification[]

    @Field(() => NotificationSettings)
    notificationSettings?: NotificationSettings

    @Field(() => [Follow])
    followers?: Follow[]

    @Field(() => [Follow])
    followings?: Follow[]

    @Field(() => [Role], { nullable: true })
    roles?: Role[]
}
