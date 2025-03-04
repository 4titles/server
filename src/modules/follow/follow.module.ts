import { Module } from '@nestjs/common'
import { FollowResolver } from './follow.resolver'
import { FollowService } from './follow.service'

@Module({
    providers: [FollowResolver, FollowService],
})
export class FollowModule {}
