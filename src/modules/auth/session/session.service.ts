import { CacheService } from '@/modules/cache/cache.service'
import { getSessionMetada } from '@/shared/utils/session-metadata.util'
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

    constructor(
        private readonly accountService: AccountService,
        private readonly cacheService: CacheService,
        private readonly configService: ConfigService,
    ) {}

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

        const sessionMetadata = getSessionMetada(req, userAgent)

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

        const keys = await this.cacheService.get<Array<string>>('*')

        const userSessions = []
        for (const key of keys) {
            const sessionData = await this.cacheService.get<string>(key)

            if (sessionData) {
                const session = JSON.parse(sessionData)

                if (session.userId === userId) {
                    userSessions.push({
                        ...session,
                        id: key.split(':')[1],
                    })
                }
            }
        }

        userSessions.sort((a, b) => b?.createdAt - a?.createdAt)

        return userSessions.filter((session) => session.id === req.session.id)
    }

    async findCurrent(req: FastifyRequest) {
        const sessionId = req.session.id
        const sessionPattern = `${this.configService.getOrThrow<string>('SESSION_FOLDER')}:${sessionId}`
        const sessionData = await this.cacheService.get<string>(sessionPattern)

        const session = JSON.parse(sessionData)

        return {
            ...session,
            id: sessionId,
        }
    }

    // async clearSession(req: FastifyRequest) {
    //     try {
    //         req.res.clearCookie(
    //             this.configService.getOrThrow<string>('SESSION_NAME'),
    //         )

    //         this.logger.debug('Failed to clear session')

    //         return true
    //     } catch (error) {
    //         return false
    //     }
    // }

    public async remove(req: FastifyRequest, id: string) {
        if (req.session.id === id) {
            throw new ConflictException('Cannot delete current session')
        }

        await this.cacheService.del(
            `${this.configService.getOrThrow<string>('SESSION_FOLDER')}${id}`,
        )

        return true
    }
}
