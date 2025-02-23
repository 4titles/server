import { DrizzleModule } from '@/modules/drizzle/drizzle.module'
import { Module } from '@nestjs/common'
import { AccountModule } from '../account/account.module'
import { VerificationResolver } from './verification.resolver'
import { VerificationService } from './verification.service'

@Module({
    imports: [AccountModule, DrizzleModule],
    providers: [VerificationResolver, VerificationService],
})
export class VerificationModule {}
