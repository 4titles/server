import { Module } from '@nestjs/common'
import { NotificationService } from '../../infrastructure/notification/notification.service'
import { FollowResolver } from './follow.resolver'
import { FollowService } from './follow.service'

@Module({
    providers: [FollowResolver, FollowService, NotificationService],
    exports: [FollowService],
})
export class FollowModule {}
