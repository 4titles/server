import { Action } from '@/modules/auth/rbac/enums/actions.enum'
import { Resource } from '@/modules/auth/rbac/enums/resources.enum'
import { Authorized } from '@/shared/decorators/authorized.decorator'
import { RbacProtected } from '@/shared/guards/rbac-protected.guard'
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql'
import { User } from '../../auth/account/models/user.model'
import { ChangeNotificationSettingsInput } from './inputs/change-notification-settings.input'
import { CreateGlobalNotificationInput } from './inputs/create-global-notification.input'
import { ChangeNotificationSettingsResponse } from './models/notification-settings.model'
import { Notification } from './models/notification.model'
import { NotificationService } from './notification.service'

@Resolver(() => Notification)
export class NotificationResolver {
    constructor(private readonly notificationService: NotificationService) {}

    @RbacProtected({
        resource: Resource.NOTIFICATION,
        action: Action.READ,
        possession: 'own',
    })
    @Query(() => Number, { description: 'Find undread notifications count' })
    async findUnreadCount(@Authorized() user: User) {
        return await this.notificationService.findUnreadCount(user)
    }

    @RbacProtected({
        resource: Resource.NOTIFICATION,
        action: Action.READ,
        possession: 'own',
    })
    @Query(() => [Notification], { description: 'Find notifications by user' })
    async findByUser(@Authorized() user: User) {
        return await this.notificationService.findByUser(user)
    }

    @RbacProtected({
        resource: Resource.NOTIFICATION,
        action: Action.UPDATE,
        possession: 'own',
    })
    @Mutation(() => ChangeNotificationSettingsResponse, {
        description: 'Change notification settings',
    })
    async changeSettings(
        @Authorized() user: User,
        @Args('data') input: ChangeNotificationSettingsInput,
    ) {
        return await this.notificationService.changeSettings(user, input)
    }

    @RbacProtected({
        resource: Resource.NOTIFICATION,
        action: Action.CREATE,
        possession: 'any',
    })
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
