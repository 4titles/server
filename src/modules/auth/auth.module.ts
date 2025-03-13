import { Module } from '@nestjs/common'
import { AccountModule } from './account/account.module'
import { DeactivateModule } from './deactivate/deactivate.module'
import { ProfileModule } from './profile/profile.module'
import { RecoveryModule } from './recovery/recovery.module'
import { SessionModule } from './session/session.module'
import { TotpModule } from './totp/totp.module'
import { VerificationModule } from './verification/verification.module'

@Module({
    imports: [
        AccountModule,
        DeactivateModule,
        ProfileModule,
        RecoveryModule,
        SessionModule,
        TotpModule,
        VerificationModule,
    ],
})
export class AuthModule {}
