import { MailerService } from '@nestjs-modules/mailer'
import { Injectable } from '@nestjs/common'

@Injectable()
export class SMTPHealthService {
    private readonly TIMEOUT_MS = 5000

    constructor(private readonly mailerService: MailerService) {}

    async check(key: string): Promise<Record<string, any>> {
        try {
            await Promise.race([
                this.mailerService.verifyAllTransporters(),
                this.timeout(this.TIMEOUT_MS),
            ])

            return { [key]: { status: 'up' } }
        } catch (error) {
            return { [key]: { status: 'down', message: error.message } }
        }
    }

    private timeout(ms: number): Promise<never> {
        return new Promise((_, reject) =>
            setTimeout(
                () => reject(new Error(`SMTP check timeout after ${ms}ms`)),
                ms,
            ),
        )
    }
}
