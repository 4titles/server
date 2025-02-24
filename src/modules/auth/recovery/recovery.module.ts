import { Module } from '@nestjs/common'
import { RecoveryResolver } from './recovery.resolver'
import { RecoveryService } from './recovery.service'

@Module({
    providers: [RecoveryResolver, RecoveryService],
})
export class RecoveryModule {}
