import { CliModule } from '@/modules/cli/cli.module'
import { Global, Module } from '@nestjs/common'
import { AccessControlModule } from 'nest-access-control'
import { RBAC_POLICY } from './rbac.policy'
import { RbacResolver } from './rbac.resolver'
import { RbacService } from './rbac.service'

@Global()
@Module({
    imports: [AccessControlModule.forRoles(RBAC_POLICY), CliModule],
    providers: [RbacResolver, RbacService],
    exports: [RbacService],
})
export class RbacModule {}
