import { ContentModerationModule } from '@/modules/content-moderation/content-moderation.module'
import { Global, Module } from '@nestjs/common'
import { VerificationService } from '../verification/verification.service'
import { AccountContextService } from './account-context.service'
import { AccountDeletionService } from './account-deletion.service'
import { AccountResolver } from './account.resolver'
import { AccountService } from './account.service'

@Global()
@Module({
    imports: [ContentModerationModule],
    providers: [
        AccountResolver,
        AccountService,
        AccountDeletionService,
        AccountContextService,
        VerificationService,
    ],
    exports: [AccountService, AccountDeletionService, AccountContextService],
})
export class AccountModule {}
