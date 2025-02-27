import { DrizzleModule } from '@/modules/drizzle/drizzle.module'
import { Module } from '@nestjs/common'
import { VerificationService } from '../verification/verification.service'
import { AccountDeletionService } from './account-deletion.service'
import { AccountResolver } from './account.resolver'
import { AccountService } from './account.service'

@Module({
    imports: [DrizzleModule],
    providers: [
        AccountResolver,
        AccountService,
        AccountDeletionService,
        VerificationService,
    ],
    exports: [AccountService, AccountDeletionService],
})
export class AccountModule {}
