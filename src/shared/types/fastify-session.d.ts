import type { SessionMetadata } from './session-metadata.types'

declare module 'fastify' {
    interface FastifyRequest {
        session: import('@mgcrea/fastify-session').Session
        res: import('@mgcrea/fastify-session')
    }
}

declare module '@mgcrea/fastify-session' {
    interface SessionData {
        userId?: string
        createdAt?: Date | string
        metadata: SessionMetadata
    }
}
