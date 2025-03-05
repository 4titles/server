import { Module } from '@nestjs/common'
import { AccountModule } from '../auth/account/account.module'
import { NotificationService } from '../notification/notification.service'
import { FollowResolver } from './follow.resolver'
import { FollowService } from './follow.service'

@Module({
    imports: [AccountModule],
    providers: [FollowResolver, FollowService, NotificationService],
})
export class FollowModule {}
