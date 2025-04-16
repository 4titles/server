import { Global, Module } from '@nestjs/common'
import { NotificationResolver } from './notification.resolver'
import { NotificationService } from './notification.service'

@Global()
@Module({
    providers: [NotificationResolver, NotificationService],
    exports: [NotificationService],
})
export class NotificationModule {}
