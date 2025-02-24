import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import { GqlExecutionContext } from '@nestjs/graphql'
import { FastifyRequest } from 'fastify'

export const UserAgent = createParamDecorator(
    (data: unknown, ctx: ExecutionContext) => {
        if (ctx.getType() === 'http') {
            const request = ctx.switchToHttp().getRequest() as FastifyRequest
            return request.headers['user-agent']
        } else {
            const context = GqlExecutionContext.create(ctx)
            return context.getContext().req.headers['user-agent']
        }
    },
)
