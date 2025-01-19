import '@mgcrea/fastify-session'

import type { FastifyReply, FastifyRequest } from 'fastify'

declare module 'fastify' {
    interface FastifyRequest {
        session: import('@mgcrea/fastify-session').Session
    }
}

export interface GqlContext {
    req: FastifyRequest
    res: FastifyReply
}
