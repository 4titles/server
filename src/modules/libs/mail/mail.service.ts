import { MailerService } from '@nestjs-modules/mailer'
import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { CourierClient } from '@trycourier/courier'

@Injectable()
export class MailService {
    private readonly logger: Logger = new Logger(MailService.name)

    constructor(
        private readonly mailerService: MailerService,
        private readonly configService: ConfigService,
    ) {}

    async sendMail(
        email: string,
        subject: string,
        html: string,
        body?: string,
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

            return await this.sendMailViaCourier(email, body)
        }
    }

    async sendMailViaCourier(email: string, body: string) {
        try {
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
                        body,
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
