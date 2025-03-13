import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Telegraf } from 'telegraf'
import { COMPANY_NAME } from '../constants/company.constants'

@Injectable()
export class TelegramLoggerService extends Telegraf {
    private readonly chatId: string
    private readonly logger = new Logger(TelegramLoggerService.name)

    constructor(private readonly configService: ConfigService) {
        super(configService.getOrThrow<string>('TELEGRAM_LOGGER_BOT_TOKEN'))
        this.chatId = this.configService.getOrThrow<string>(
            'TELEGRAM_LOGGER_CHAT_ID',
        )
    }

    async sendLog(formattedMessage: string): Promise<void> {
        try {
            await this.telegram.sendMessage(this.chatId, formattedMessage, {
                parse_mode: 'HTML',
            })
        } catch (error) {
            this.logger.error('Error sending log message to Telegram', error)
        }
    }

    async sendFatal(
        message: any,
        trace?: string,
        context?: string,
    ): Promise<void> {
        const formattedMessage = this.formatMessage(
            'fatal',
            message,
            trace,
            context,
        )
        await this.sendLog(formattedMessage)
    }

    async sendWarning(
        message: any,
        trace?: string,
        context?: string,
    ): Promise<void> {
        const formattedMessage = this.formatMessage(
            'warn',
            message,
            trace,
            context,
        )
        await this.sendLog(formattedMessage)
    }

    private formatMessage(
        level: 'warn' | 'fatal',
        message: any,
        trace?: string,
        context?: string,
    ): string {
        const timestamp = new Date().toISOString()
        const env = this.configService.get<string>('NODE_ENV') || 'prod'
        const title =
            level === 'fatal'
                ? `<b>🚨 ${COMPANY_NAME} (CRITICAL)</b>`
                : `<b>⚠️ ${COMPANY_NAME} (WARNING)</b>`
        let formatted = `${title}\n\n🕒 <i>Timestamp:</i> ${timestamp}\n🏷️ <i>Environment:</i> ${env}\n📍 <i>Message:</i> ${message}`
        if (trace) {
            formatted += `\n🔍 <i>Trace:</i> ${trace}`
        }
        if (context) {
            formatted += `\n💬 <i>Context:</i> ${context}`
        }
        return formatted
    }
}
