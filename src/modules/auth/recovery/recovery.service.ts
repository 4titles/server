import { DRIZZLE } from '@/modules/drizzle/drizzle.module'
import { DbToken, tokens } from '@/modules/drizzle/schema/tokens.schema'
import { DrizzleDB } from '@/modules/drizzle/types/drizzle'
import { MailService } from '@/modules/libs/mail/mail.service'
import { generateToken } from '@/shared/utils/generate-token.util'
import { getSessionMetadata } from '@/shared/utils/session-metadata.util'
import {
    BadRequestException,
    Inject,
    Injectable,
    NotFoundException,
} from '@nestjs/common'
import { hash } from 'argon2'
import { and, eq } from 'drizzle-orm'
import { FastifyRequest } from 'fastify'
import { DbUser, users } from '../../drizzle/schema/users.schema'
import { TokenType } from '../account/enums/token-type.enum'
import { NewPasswordInput } from './input/new-password.input'
import { ResetPasswordInput } from './input/reset-password.input'

@Injectable()
export class RecoveryService {
    constructor(
        private readonly mailService: MailService,
        @Inject(DRIZZLE) private readonly db: DrizzleDB,
    ) {}

    async resetPassword(
        req: FastifyRequest,
        input: ResetPasswordInput,
        userAgent: string,
    ): Promise<boolean> {
        const { email } = input

        const user = await this.db.query.users.findFirst({
            where: eq(users.email, email),
        })

        if (!user) {
            throw new NotFoundException('User is not found')
        }

        const resetToken = await generateToken(
            this.db,
            user,
            TokenType.PASSWORD_RESET,
        )

        await this.mailService.sendPasswordRecovery(
            user.email,
            resetToken.token,
            getSessionMetadata(req, userAgent),
        )

        return true
    }

    async setNewPassword(input: NewPasswordInput): Promise<boolean> {
        const { password, token } = input

        const existingToken: DbToken = await this.db.query.tokens.findFirst({
            where: (t, { and, eq }) =>
                and(eq(t.token, token), eq(t.type, TokenType.PASSWORD_RESET)),
        })

        if (!existingToken) {
            throw new NotFoundException('The token was not found')
        }

        const hasExpired: boolean =
            new Date(existingToken.expiresAt) < new Date()

        if (hasExpired) {
            throw new BadRequestException('The token is expired')
        }

        const userUpdate: Partial<DbUser> = { password: await hash(password) }

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
                    eq(tokens.type, TokenType.PASSWORD_RESET),
                ),
            )

        return true
    }
}
