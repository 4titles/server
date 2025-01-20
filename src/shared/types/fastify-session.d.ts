import { SessionMetadata } from './session-metadata.types'

declare module 'fastify' {
    interface FastifyRequest {
        session: import('@mgcrea/fastify-session').Session
    }
}

declare module '@mgcrea/fastify-session' {
    interface SessionData {
        userId?: string
        createdAt?: Date | string
        metadata: SessionMetadata
    }
}
