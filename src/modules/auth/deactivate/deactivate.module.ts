import { Module } from '@nestjs/common'
import { SessionModule } from '../session/session.module'
import { DeactivateResolver } from './deactivate.resolver'
import { DeactivateService } from './deactivate.service'

@Module({
    imports: [SessionModule],
    providers: [DeactivateResolver, DeactivateService],
})
export class DeactivateModule {}
