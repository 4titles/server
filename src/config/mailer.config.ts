import type { MailerOptions } from '@nestjs-modules/mailer'
import { ConfigService } from '@nestjs/config'

export default function getMailerConfig(
    configService: ConfigService,
): MailerOptions {
    return {
        transport: {
            host: configService.getOrThrow<string>('RESEND_MAIL_HOST'),
            port: configService.getOrThrow<string>('RESEND_MAIL_PORT'),
            secure: true,
            auth: {
                user: configService.getOrThrow<string>('RESEND_MAIL_USER'),
                pass: configService.getOrThrow<string>('RESEND_MAIL_PASS'),
            },
        },
        defaults: {
            from: `"4Titles" <${configService.getOrThrow<string>('RESEND_MAIL_SENDER')}>`,
        },
    }
}
