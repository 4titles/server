import { AuthModel } from '@/modules/auth/account/models/auth.model'
import { User } from '@/modules/auth/account/models/user.model'
import { SessionMetadata } from '@/shared/types/session-metadata.types'
import { InternalServerErrorException } from '@nestjs/common'
import { FastifyRequest } from 'fastify'

export async function saveSession(
    req: FastifyRequest,
    user: User,
    metadata?: SessionMetadata,
): Promise<AuthModel> {
    return new Promise((resolve, reject) => {
        req.session.set('userId', user.id)
        req.session.set('createdAt', new Date().toISOString())
        req.session.set('metadata', metadata)

        try {
            req.session.save()
            resolve({ user })
        } catch {
            return reject(
                new InternalServerErrorException('Failed to save session'),
            )
        }
    })
}

export async function destroySession(req: FastifyRequest): Promise<boolean> {
    return new Promise((resolve, reject) => {
        try {
            req.session.destroy()
            resolve(true)
        } catch {
            reject(
                new InternalServerErrorException('Failed to destroy session'),
            )
        }
    })
}
