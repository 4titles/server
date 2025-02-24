import { DrizzleModule } from '@/modules/drizzle/drizzle.module'
import { Module } from '@nestjs/common'
import { VerificationService } from '../verification/verification.service'
import { AccountResolver } from './account.resolver'
import { AccountService } from './account.service'

@Module({
    imports: [DrizzleModule],
    providers: [AccountResolver, AccountService, VerificationService],
    exports: [AccountService],
})
export class AccountModule {}
