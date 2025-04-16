import type { SessionMetadata } from '@/shared/types/session-metadata.types'
import { MailerService } from '@nestjs-modules/mailer'
import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { render } from '@react-email/components'
import { CourierClient } from '@trycourier/courier'
import { MailType } from './enums/mail-type.enum'
import { AccountDeletionTemplate } from './templates/account-deletion.template'
import { DeactiveTemplate } from './templates/deactivation.template'
import { RecoveryTemplate } from './templates/recovery.template'
import { VerificationTemplate } from './templates/verification.template'

@Injectable()
export class MailService {
    private readonly logger: Logger = new Logger(MailService.name)
    private MAIL_SEND_TIMEOUT_IN_MS = 7000

    constructor(
        private readonly mailerService: MailerService,
        private readonly configService: ConfigService,
    ) {}

    async sendVerification(email: string, token: string): Promise<boolean> {
        const domain = this.configService.getOrThrow<string>('ALLOWED_ORIGIN')
        const html = await render(VerificationTemplate({ domain, token }))
        return this.sendMail(
            email,
            'Верификация аккаунта',
            html,
            token,
            MailType.VERIFICATION,
        )
    }

    async sendPasswordRecovery(
        email: string,
        token: string,
        metadata: SessionMetadata,
    ): Promise<boolean> {
        const domain = this.configService.getOrThrow<string>('ALLOWED_ORIGIN')
        const html = await render(RecoveryTemplate({ domain, token, metadata }))
        return this.sendMail(
            email,
            'Сброс пароля',
            html,
            token,
            MailType.RECOVERY,
        )
    }

    async sendDeactivationToken(
        email: string,
        token: string,
        metadata: SessionMetadata,
    ): Promise<boolean> {
        const html = await render(DeactiveTemplate({ token, metadata }))
        return this.sendMail(
            email,
            'Деактивация аккаунта',
            html,
            token,
            MailType.DEACTIVATION,
        )
    }

    async sendAccountDeletion(email: string): Promise<boolean> {
        const domain = this.configService.getOrThrow<string>('ALLOWED_ORIGIN')
        const html = await render(AccountDeletionTemplate({ domain }))
        return this.sendMail(
            email,
            'Удаление аккаунта',
            html,
            '',
            MailType.DELETION,
        )
    }

    async sendMail(
        email: string,
        subject: string,
        html: string,
        token: string,
        mailType: MailType,
    ): Promise<boolean> {
        try {
            this.logger.debug(
                `Trying to send email to ${email} using main SMTP service`,
            )

            await Promise.race([
                this.mailerService.sendMail({
                    to: email,
                    subject,
                    html,
                }),
                new Promise((_, reject) =>
                    setTimeout(
                        () => reject(new Error('Timeout exceeded')),
                        this.MAIL_SEND_TIMEOUT_IN_MS,
                    ),
                ),
            ])

            this.logger.debug(
                `Email was sucessfully sent to ${email} using main SMTP service`,
            )
            return true
        } catch (error) {
            this.logger.error(
                `Failed to send email via main SMTP service: ${error.message}. Trying via fallback.`,
            )

            return await this.sendMailViaCourier(email, token, mailType)
        }
    }

    private async sendMailViaCourier(
        email: string,
        token: string,
        mailType: MailType,
    ): Promise<boolean> {
        try {
            const domain =
                this.configService.getOrThrow<string>('ALLOWED_ORIGIN')
            const courier = new CourierClient({
                authorizationToken:
                    this.configService.getOrThrow<string>('COURIER_AUTH_TOKEN'),
            })

            let templateId: string
            const data: Record<string, any> = { recipientEmail: email }
            const baseLink = `${domain}/account`

            switch (mailType) {
                case MailType.VERIFICATION:
                    templateId = this.configService.getOrThrow<string>(
                        'COURIER_MAIL_VERIFICATION_TEMPLATE',
                    )
                    data.verificationLink = `${baseLink}/verify?token=${token}`
                    break
                case MailType.RECOVERY:
                    templateId = this.configService.getOrThrow<string>(
                        'COURIER_MAIL_ACCOUNT_RECOVERY_TEMPLATE',
                    )
                    data.recoveryLink = `${baseLink}/recovery?token=${token}`
                    break
                case MailType.DEACTIVATION:
                    templateId = this.configService.getOrThrow<string>(
                        'COURIER_MAIL_ACCOUNT_DEACTIVATION_TEMPLATE',
                    )
                    data.token = token
                    break
                case MailType.DELETION:
                    templateId = this.configService.getOrThrow<string>(
                        'COURIER_MAIL_ACCOUNT_DELETION_TEMPLATE',
                    )
                    data.accountCreationLink = `${baseLink}/create`
                    break
                default:
                    throw new Error(`Unknown mail type: ${mailType}`)
            }

            const { requestId } = await courier.send({
                message: {
                    to: {
                        email,
                    },
                    routing: {
                        method: 'single',
                        channels: ['email'],
                    },
                    timeout: {
                        message: 1800000, // 30 min in ms
                    },
                    template: templateId,
                    data,
                },
            })

            this.logger.debug(
                `Email was successfully sent via Courier using template ${templateId}. requestId: ${requestId}`,
            )
            return true
        } catch (fallbackError) {
            this.logger.error(
                `Failed to send email via Courier: ${fallbackError.message}`,
            )
            return false
        }
    }
}
