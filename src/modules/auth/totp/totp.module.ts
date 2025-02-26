import { Module } from '@nestjs/common'
import { AccountModule } from '../account/account.module'
import { TotpResolver } from './totp.resolver'
import { TotpService } from './totp.service'

@Module({
    imports: [AccountModule],
    providers: [TotpResolver, TotpService],
})
export class TotpModule {}
