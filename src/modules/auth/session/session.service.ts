import { CacheService } from '@/modules/infrastructure/cache/cache.service'
import { COMPANY_NAME } from '@/shared/constants/company.constants'
import { getSessionMetadata } from '@/shared/utils/seesion/session-metadata.util'
import {
    destroySession,
    saveSession,
} from '@/shared/utils/seesion/session.utils'
import {
    BadRequestException,
    ConflictException,
    Injectable,
    Logger,
    NotFoundException,
    UnauthorizedException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { verify } from 'argon2'
import type { FastifyRequest } from 'fastify'
import { TOTP } from 'otpauth'
import { AccountService } from '../account/account.service'
import { AuthModel } from '../account/models/auth.model'
import { VerificationService } from '../verification/verification.service'
import { LoginInput } from './inputs/login.input'

@Injectable()
export class SessionService {
    private readonly logger = new Logger(SessionService.name)
    private sessionFolder: string

    constructor(
        private readonly accountService: AccountService,
        private readonly cacheService: CacheService,
        private readonly configService: ConfigService,
        private readonly verificationService: VerificationService,
    ) {
        this.sessionFolder = this.configService
            .getOrThrow<string>('SESSION_FOLDER')
            .split(':')[0]
    }

    async login(
        req: FastifyRequest,
        input: LoginInput,
        userAgent: string,
    ): Promise<AuthModel> {
        const { login, password, pin } = input
        const user = await this.accountService.findByLogin(login)

        if (!user) {
            throw new NotFoundException('User not found')
        }

        const isPasswordValid = await verify(user.password, password)
        if (!isPasswordValid) {
            throw new UnauthorizedException('Password is invalid')
        }

        if (!user.emailVerifiedAt) {
            await this.verificationService.sendVerificationToken(user)

            throw new BadRequestException(
                'Account is not verified. Please, check your inbox.',
            )
        }

        if (user.isTotpEnabled) {
            if (!pin) {
                return {
                    message: 'A code is required to complete authorization',
                }
            }

            const totp = new TOTP({
                issuer: COMPANY_NAME,
                label: user.email,
                algorithm: 'SHA1',
                digits: 6,
                secret: user.totpSecret,
            })

            const delta = totp.validate({ token: pin })

            if (delta === null) {
                throw new BadRequestException('Invalid code was provided')
            }
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
