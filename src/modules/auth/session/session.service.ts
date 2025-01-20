import { destroySession, saveSession } from '@/shared/utils/session.utils'
import {
    Injectable,
    NotFoundException,
    UnauthorizedException,
} from '@nestjs/common'
import { verify } from 'argon2'
import type { FastifyRequest } from 'fastify'
import { AccountService } from '../account/account.service'
import { User } from '../account/models/user.model'
import { LoginInput } from './inputs/login.input'

@Injectable()
export class SessionService {
    constructor(private readonly accountService: AccountService) {}

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

        return saveSession(req, user) // TODO: add metadata
    }

    async logout(req: FastifyRequest): Promise<boolean> {
        return await destroySession(req)
    }
}
