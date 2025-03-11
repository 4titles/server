import { Module } from '@nestjs/common'
import { VerificationService } from '../verification/verification.service'
import { SessionResolver } from './session.resolver'
import { SessionService } from './session.service'

@Module({
    providers: [SessionService, SessionResolver, VerificationService],
})
export class SessionModule {}
