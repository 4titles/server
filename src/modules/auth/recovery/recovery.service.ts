import { DRIZZLE } from '@/modules/infrastructure/drizzle/drizzle.module'
import {
    DbToken,
    tokens,
} from '@/modules/infrastructure/drizzle/schema/tokens.schema'
import {
    DbUser,
    users,
} from '@/modules/infrastructure/drizzle/schema/users.schema'
import { DrizzleDB } from '@/modules/infrastructure/drizzle/types/drizzle'
import { MailService } from '@/modules/infrastructure/mail/mail.service'
import { TelegramService } from '@/modules/infrastructure/telegram/telegram.service'
import { generateToken } from '@/shared/utils/common/generate-token.util'
import { getSessionMetadata } from '@/shared/utils/seesion/session-metadata.util'
import {
    BadRequestException,
    Inject,
    Injectable,
    NotFoundException,
} from '@nestjs/common'
import { hash } from 'argon2'
import { and, eq } from 'drizzle-orm'
import { FastifyRequest } from 'fastify'
import { TokenType } from '../account/enums/token-type.enum'
import { User } from '../account/models/user.model'
import { NewPasswordInput } from './input/new-password.input'
import { ResetPasswordInput } from './input/reset-password.input'

@Injectable()
export class RecoveryService {
    constructor(
        private readonly mailService: MailService,
        private readonly telegramService: TelegramService,
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
            with: { notificationSettings: true },
        })

        if (!user) {
            throw new NotFoundException('User is not found')
        }

        const resetToken = await generateToken(
            this.db,
            user as User,
            TokenType.PASSWORD_RESET,
        )

        const metadata = getSessionMetadata(req, userAgent)

        await this.mailService.sendPasswordRecovery(
            user.email,
            resetToken.token,
            metadata,
        )

        if (
            user.notificationSettings.isTelegramNotificationsEnabled &&
            user.telegramId
        ) {
            await this.telegramService.sendPasswordResetToken(
                user.telegramId,
                resetToken.token,
                metadata,
            )
        }

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
