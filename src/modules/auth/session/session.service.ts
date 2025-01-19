import {
    Injectable,
    InternalServerErrorException,
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
    private readonly logger: Logger = new Logger(SessionService.name)

    constructor(
        private readonly accountService: AccountService,
        private readonly configService: ConfigService,
    ) {}

    async login(req: FastifyRequest, input: LoginInput): Promise<User> {
        const { login, password } = input
        const user = await this.accountService.findByLogin(login)

        if (!user) {
            throw new NotFoundException('User not found')
        }

        const isPasswordValid = await verify(user.password, password)
        if (!isPasswordValid) {
            throw new UnauthorizedException('Password is invalid')
        }

        return new Promise((resolve, reject) => {
            req.session.set('userId', user.id)
            req.session.set('createdAt', new Date().toISOString())

            try {
                req.session.save()
                resolve(user)
            } catch {
                return reject(
                    new InternalServerErrorException('Failed to save session'),
                )
            }
        })
    }

    async logout(req: FastifyRequest) {
        return new Promise((resolve, reject) => {
            try {
                req.session.destroy()
                resolve(true)
            } catch (err) {
                this.logger.error(`Error occurred on logout: ${err}`)
                reject(
                    new InternalServerErrorException(
                        'Failed to destroy session',
                    ),
                )
            }
        })
    }
}
