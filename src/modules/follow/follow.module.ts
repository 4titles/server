import { Module } from '@nestjs/common'
import { AccountModule } from '../auth/account/account.module'
import { FollowResolver } from './follow.resolver'
import { FollowService } from './follow.service'

@Module({
    imports: [AccountModule],
    providers: [FollowResolver, FollowService],
})
export class FollowModule {}
