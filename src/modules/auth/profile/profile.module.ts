import { Module } from '@nestjs/common'
import { AccountModule } from '../account/account.module'
import { ProfileResolver } from './profile.resolver'
import { ProfileService } from './profile.service'

@Module({
    imports: [AccountModule],
    providers: [ProfileResolver, ProfileService],
})
export class ProfileModule {}
