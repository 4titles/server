import { Module } from '@nestjs/common'
import { AccountModule } from '../account/account.module'
import { DeactivateResolver } from './deactivate.resolver'
import { DeactivateService } from './deactivate.service'

@Module({
    imports: [AccountModule],
    providers: [DeactivateResolver, DeactivateService],
})
export class DeactivateModule {}
