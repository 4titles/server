import { Authorization } from '@/shared/decorators/auth.decorator'
import { Authorized } from '@/shared/decorators/authorized.decorator'
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql'
import { User } from '../auth/account/models/user.model'
import { ChangeNotificationSettingsInput } from './inputs/change-notification-settings.input'
import { CreateGlobalNotificationInput } from './inputs/create-global-notification.input'
import { ChangeNotificationSettingsResponse } from './models/notification-settings.model'
import { Notification } from './models/notification.model'
import { NotificationService } from './notification.service'

@Resolver('Notification')
export class NotificationResolver {
    constructor(private readonly notificationService: NotificationService) {}

    @Authorization()
    @Query(() => Number, { description: 'Find undread notifications count' })
    async findUnreadCount(@Authorized() user: User) {
        return await this.notificationService.findUnreadCount(user)
    }

    @Authorization()
    @Query(() => [Notification], { description: 'Find notifications by user' })
    async findByUser(@Authorized() user: User) {
        return await this.notificationService.findByUser(user)
    }

    @Authorization()
    @Mutation(() => ChangeNotificationSettingsResponse, {
        description: 'Change notification settings',
    })
    async changeSettings(
        @Authorized() user: User,
        @Args('data') input: ChangeNotificationSettingsInput,
    ) {
        return await this.notificationService.changeSettings(user, input)
    }

    @Authorization()
    // @Roles(UserRole.ADMIN)
    @Mutation(() => Notification, {
        description: 'Create a global notification for all users',
    })
    async createGlobalNotification(
        @Authorized() user: User,
        @Args('data') input: CreateGlobalNotificationInput,
    ): Promise<Notification> {
        return await this.notificationService.createGlobalNotification(
            input.message,
        )
    }
}
