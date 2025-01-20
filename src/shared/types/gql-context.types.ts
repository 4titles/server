import type { FastifyReply, FastifyRequest } from 'fastify'

export interface GqlContext {
    req: FastifyRequest
    res: FastifyReply
}
