import { AccountService } from '@/modules/auth/account/account.service'
import {
    type CanActivate,
    type ExecutionContext,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common'
import { GqlExecutionContext } from '@nestjs/graphql'

@Injectable()
export class GqlAuthGuard implements CanActivate {
    constructor(private readonly accountService: AccountService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const ctx = GqlExecutionContext.create(context)
        const request = ctx.getContext().req
        const userId: string | undefined = request.session.get('userId')

        if (typeof userId === 'undefined') {
            throw new UnauthorizedException()
        }

        const user = await this.accountService.findById(userId)

        request.user = user

        return true
    }
}
