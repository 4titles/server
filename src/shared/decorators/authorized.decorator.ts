import { type User } from '@/modules/auth/account/models/user.model'
import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import { GqlExecutionContext } from '@nestjs/graphql'

export const Authorized = createParamDecorator(
    (data: keyof User, ctx: ExecutionContext) => {
        let user: User

        if (ctx.getType() === 'http') {
            user = ctx.switchToHttp().getRequest().user
        } else {
            const context = GqlExecutionContext.create(ctx)
            user = context.getContext().req.user
        }

        return data ? user[data] : user
    },
)
