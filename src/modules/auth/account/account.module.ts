import { ContentModerationModule } from '@/modules/content-moderation/content-moderation.module'
import { DrizzleModule } from '@/modules/drizzle/drizzle.module'
import { Module } from '@nestjs/common'
import { VerificationService } from '../verification/verification.service'
import { AccountDeletionService } from './account-deletion.service'
import { AccountResolver } from './account.resolver'
import { AccountService } from './account.service'

@Module({
    imports: [DrizzleModule, ContentModerationModule],
    providers: [
        AccountResolver,
        AccountService,
        AccountDeletionService,
        VerificationService,
    ],
    exports: [AccountService, AccountDeletionService],
})
export class AccountModule {}
