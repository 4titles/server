import { Module } from '@nestjs/common'
import { AccountResolver } from './account.resolver'
import { AccountService } from './account.service'
import { DrizzleModule } from '@/modules/drizzle/drizzle.module'

@Module({
    imports: [DrizzleModule],
    providers: [AccountResolver, AccountService],
})
export class AccountModule {}
