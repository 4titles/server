import type { SessionMetadata } from '@/shared/types/session-metadata.types'
import { MailerService } from '@nestjs-modules/mailer'
import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { render } from '@react-email/components'
import { CourierClient } from '@trycourier/courier'
import { DeactiveTemplate } from './templates/deactivation.template'
import { RecoveryTemplate } from './templates/recovery.template'
import { VerificationTemplate } from './templates/verification.template'

@Injectable()
export class MailService {
    private readonly logger: Logger = new Logger(MailService.name)

    constructor(
        private readonly mailerService: MailerService,
        private readonly configService: ConfigService,
    ) {}

    async sendVerification(email: string, token: string): Promise<boolean> {
        const domain = this.configService.getOrThrow<string>('ALLOWED_ORIGIN')
        const html = await render(VerificationTemplate({ domain, token }))
        return this.sendMail(email, 'Верификация аккаунта', html, token)
    }

    async sendPasswordRecovery(
        email: string,
        token: string,
        metadata: SessionMetadata,
    ): Promise<boolean> {
        const domain = this.configService.getOrThrow<string>('ALLOWED_ORIGIN')
        const html = await render(RecoveryTemplate({ domain, token, metadata }))
        return this.sendMail(email, 'Сброс пароля', html, token)
    }

    async sendDeactivationToken(
        email: string,
        token: string,
        metadata: SessionMetadata,
    ): Promise<boolean> {
        const html = await render(DeactiveTemplate({ token, metadata }))
        return this.sendMail(email, 'Деактивация аккаунта', html, token)
    }

    async sendMail(
        email: string,
        subject: string,
        html: string,
        token: string,
    ): Promise<boolean> {
        try {
            this.logger.debug(
                `Trying to send email to ${email} using main SMTP service`,
            )

            await this.mailerService.sendMail({
                to: email,
                subject,
                html,
            })

            this.logger.debug(
                `Email was sucessfully sent to ${email} using main SMTP service`,
            )
            return true
        } catch (error) {
            this.logger.error(
                `Failed to send email via main SMTP service: ${error.message}. Trying via fallback.`,
            )

            return await this.sendMailViaCourier(email, token)
        }
    }

    private async sendMailViaCourier(email: string, token: string) {
        try {
            const domain =
                this.configService.getOrThrow<string>('ALLOWED_ORIGIN')
            const verificationLink = this.configService.getOrThrow<string>(
                'EMAIL_VERIFICATION_LINK',
            )

            const courier = new CourierClient({
                authorizationToken:
                    this.configService.getOrThrow<string>('COURIER_AUTH_TOKEN'),
            })

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
                    template: this.configService.getOrThrow<string>(
                        'COURIER_MAIL_TEMPLATE',
                    ),
                    data: {
                        recipientName: email,
                        profile: this.configService.getOrThrow<string>(
                            'COURIER_MAIL_PROFILE',
                        ),
                        verificationLink: `${domain}/${verificationLink}?token=${token}`,
                    },
                },
            })

            this.logger.debug(
                `An email was successfully sent via Courier. requestId: ${requestId}`,
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
