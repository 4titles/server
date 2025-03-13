import { ConsoleLogger, Injectable } from '@nestjs/common'
import { TelegramLoggerService } from './telegram-logger.service'

@Injectable()
export class AppLoggerService extends ConsoleLogger {
    constructor(private readonly telegramLoggerService: TelegramLoggerService) {
        super()
    }

    log(message: any, ...optionalParams: any[]): void {
        super.log(message, ...optionalParams)
    }

    error(message: any, ...optionalParams: any[]): void {
        super.log(message, ...optionalParams)
    }

    debug(message: any, ...optionalParams: any[]): void {
        super.debug(message, ...optionalParams)
    }

    verbose(message: any, ...optionalParams: any[]): void {
        super.verbose(message, ...optionalParams)
    }

    fatal(message: unknown, context?: unknown, ...rest: unknown[]): void {
        super.fatal(message, context, ...rest)
        this.telegramLoggerService.sendFatal(
            message,
            rest['trace'] || undefined,
            context as string,
        )
    }

    warn(message: any, ...optionalParams: any[]): void {
        const [context, trace] = optionalParams
        super.warn(message, context || '')
        this.telegramLoggerService.sendWarning(
            message,
            trace || undefined,
            context,
        )
    }
}
