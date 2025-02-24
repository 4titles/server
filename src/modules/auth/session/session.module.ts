import { Module } from '@nestjs/common'
import { AccountModule } from '../account/account.module'
import { VerificationService } from '../verification/verification.service'
import { SessionResolver } from './session.resolver'
import { SessionService } from './session.service'

@Module({
    imports: [AccountModule],
    providers: [SessionService, SessionResolver, VerificationService],
})
export class SessionModule {}
