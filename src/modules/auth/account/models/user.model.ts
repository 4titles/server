import { Comment } from '@/modules/content/comment/models/comment.model'
import { Follow } from '@/modules/content/follow/models/follow.model'
import { NotificationSettings } from '@/modules/infrastructure/notification/models/notification-settings.model'
import { Notification } from '@/modules/infrastructure/notification/models/notification.model'
import { Field, Int, ObjectType } from '@nestjs/graphql'
import { SocialLink } from '../../profile/models/social-link.model'
import { UserActivity } from '../../profile/models/user-activity.model'
import { Role } from '../../rbac/models/role.model'

@ObjectType()
export class User {
    @Field(() => String)
    id: string

    @Field(() => String)
    email: string

    @Field(() => String, { nullable: true })
    password?: string

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

    @Field(() => [SocialLink], { nullable: true })
    socialLinks?: SocialLink[]

    @Field(() => [Notification], { nullable: true })
    notifications?: Notification[]

    @Field(() => NotificationSettings, { nullable: true })
    notificationSettings?: NotificationSettings

    @Field(() => [Follow], { nullable: true })
    followers?: Follow[]

    @Field(() => [Follow], { nullable: true })
    followings?: Follow[]

    @Field(() => [Role], { nullable: true })
    roles?: Role[]

    @Field(() => [Comment], { nullable: true })
    comments?: Comment[]

    @Field(() => Int)
    locationsAdded?: number

    @Field(() => Int)
    collectionsAdded?: number

    @Field(() => Int)
    commentsCreated?: number

    @Field(() => UserActivity, { nullable: true })
    activity?: UserActivity
}
