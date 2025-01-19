import { Module } from '@nestjs/common'
import { SessionService } from './session.service'
import { AccountModule } from '../account/account.module'
import { SessionResolver } from './session.resolver'

@Module({
    imports: [AccountModule],
    providers: [SessionService, SessionResolver],
})
export class SessionModule {}
