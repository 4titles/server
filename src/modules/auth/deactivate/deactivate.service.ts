import { DRIZZLE } from '@/modules/drizzle/drizzle.module'
import { DbToken, tokens } from '@/modules/drizzle/schema/tokens.schema'
import { DbUser, users } from '@/modules/drizzle/schema/users.schema'
import { DrizzleDB } from '@/modules/drizzle/types/drizzle'
import { MailService } from '@/modules/libs/mail/mail.service'
import { generateToken } from '@/shared/utils/generate-token.util'
import { getSessionMetadata } from '@/shared/utils/session-metadata.util'
import { destroySession } from '@/shared/utils/session.utils'
import {
    BadRequestException,
    Inject,
    Injectable,
    Logger,
    NotFoundException,
} from '@nestjs/common'
import { verify } from 'argon2'
import { and, eq } from 'drizzle-orm'
import type { FastifyRequest } from 'fastify'
import { TokenType } from '../account/enums/token-type.enum'
import { AuthModel } from '../account/models/auth.model'
import { User } from '../account/models/user.model'
import { DeactivateAccountInput } from './inputs/deactivate-account.input'

@Injectable()
export class DeactivateService {
    private readonly logger: Logger = new Logger(DeactivateService.name)

    constructor(
        @Inject(DRIZZLE) private readonly db: DrizzleDB,
        private readonly mailService: MailService,
    ) {}

    async deactivate(
        req: FastifyRequest,
        input: DeactivateAccountInput,
        user: User,
        userAgent: string,
    ): Promise<AuthModel> {
        if (user.isDeactivated) {
            return {
                message: 'This account is already deactivated.',
            }
        }

        const { email, password, pin } = input

        if (user.email !== email) {
            throw new BadRequestException('Incorrect email address')
        }

        const isValidPassword = await verify(user.password, password)

        if (!isValidPassword) {
            throw new BadRequestException('Incorrect password')
        }

        if (!pin) {
            await this.sendDeactivationToken(req, user, userAgent)

            return { message: 'A confirmation code is required' }
        }

        await this.validateDeactivationToken(req, pin)

        return { user }
    }

    private async validateDeactivationToken(
        req: FastifyRequest,
        token: string,
    ): Promise<boolean> {
        const existingToken: DbToken = await this.db.query.tokens.findFirst({
            where: (t, { and, eq }) =>
                and(
                    eq(t.token, token),
                    eq(t.type, TokenType.DEACTIVATE_ACCOUNT),
                ),
        })

        if (!existingToken) {
            throw new NotFoundException('The token was not found')
        }

        const hasExpired: boolean =
            new Date(existingToken.expiresAt) < new Date()

        if (hasExpired) {
            throw new BadRequestException('The token is expired')
        }

        const userUpdate: Partial<DbUser> = {
            isDeactivated: true,
            deactivatedAt: new Date(),
        }

        await this.db
            .update(users)
            .set(userUpdate)
            .where(eq(users.id, existingToken.userId))
            .returning()

        await this.db
            .delete(tokens)
            .where(
                and(
                    eq(tokens.id, existingToken.id),
                    eq(tokens.type, TokenType.EMAIL_VERIFY),
                ),
            )

        return destroySession(req)
    }

    async sendDeactivationToken(
        req: FastifyRequest,
        user: User,
        userAgent: string,
    ): Promise<boolean> {
        try {
            const deactivationToken = await generateToken(
                this.db,
                user,
                TokenType.DEACTIVATE_ACCOUNT,
                false,
            )

            await this.mailService.sendDeactivationToken(
                user.email,
                deactivationToken.token,
                getSessionMetadata(req, userAgent),
            )

            return true
        } catch (error) {
            this.logger.error(
                `Failed to send deactivation token: ${error.message}`,
            )
            return false
        }
    }
}
