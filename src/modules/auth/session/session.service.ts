import { CacheService } from '@/modules/cache/cache.service'
import { getSessionMetadata } from '@/shared/utils/session-metadata.util'
import { destroySession, saveSession } from '@/shared/utils/session.utils'
import {
    ConflictException,
    Injectable,
    Logger,
    NotFoundException,
    UnauthorizedException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { verify } from 'argon2'
import type { FastifyRequest } from 'fastify'
import { AccountService } from '../account/account.service'
import { User } from '../account/models/user.model'
import { LoginInput } from './inputs/login.input'

@Injectable()
export class SessionService {
    private readonly logger = new Logger(SessionService.name)
    private sessionFolder: string

    constructor(
        private readonly accountService: AccountService,
        private readonly cacheService: CacheService,
        private readonly configService: ConfigService,
    ) {
        this.sessionFolder = this.configService
            .getOrThrow<string>('SESSION_FOLDER')
            .split(':')[0]
    }

    async login(
        req: FastifyRequest,
        input: LoginInput,
        userAgent: string,
    ): Promise<User> {
        const { login, password } = input
        const user = await this.accountService.findByLogin(login)

        if (!user) {
            throw new NotFoundException('User not found')
        }

        const isPasswordValid = await verify(user.password, password)
        if (!isPasswordValid) {
            throw new UnauthorizedException('Password is invalid')
        }

        const sessionMetadata = getSessionMetadata(req, userAgent)

        return saveSession(req, user, sessionMetadata)
    }

    async logout(req: FastifyRequest): Promise<boolean> {
        return await destroySession(req)
    }

    async findByUser(req: FastifyRequest) {
        const userId = req.session.get('userId')
        if (!userId) {
            throw new NotFoundException('User was not found in session')
        }

        const client = await this.cacheService.getClient()
        const keys = await client.keys(`${this.sessionFolder}:*`)

        const userSessions = []
        for (const key of keys) {
            try {
                const sessionData = await client.hget(key, 'data')
                if (sessionData) {
                    const session = JSON.parse(sessionData)
                    const sessionId = key.split(`${this.sessionFolder}:`)[1]
                    console.log(this.sessionFolder)
                    console.log(sessionId)

                    if (session.userId === userId) {
                        userSessions.push({
                            ...session,
                            id: sessionId,
                        })
                    }
                }
            } catch (error) {
                this.logger.log(
                    `Error processing session key ${key}: ${error.message}`,
                )
            }
        }

        return userSessions.sort((a, b) => b.createdAt - a.createdAt)
    }

    async findCurrent(req: FastifyRequest) {
        const sessionId = req.session.id
        const sessionKey = `${this.sessionFolder}:${sessionId}`

        const sessionData = await (
            await this.cacheService.getClient()
        ).hget(sessionKey, 'data')

        if (!sessionData) {
            throw new NotFoundException('Session not found')
        }

        const session = JSON.parse(sessionData)
        return { ...session, id: sessionId }
    }

    async clearSession(req: FastifyRequest) {
        return await destroySession(req) // ???
    }

    public async remove(req: FastifyRequest, id: string) {
        if (req.session.id === id) {
            throw new ConflictException('Cannot delete current session')
        }

        const sessionKey = `${this.sessionFolder}:${id}`

        if (!(await this.cacheService.exists(sessionKey))) {
            throw new ConflictException(
                `Session with key ${sessionKey} does not exist`,
            )
        }

        await this.cacheService.del(sessionKey)

        return true
    }
}
