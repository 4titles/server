import { Module } from '@nestjs/common'
import { AccountModule } from '../auth/account/account.module'
import { NotificationResolver } from './notification.resolver'
import { NotificationService } from './notification.service'

@Module({
    imports: [AccountModule],
    providers: [NotificationResolver, NotificationService],
})
export class NotificationModule {}
