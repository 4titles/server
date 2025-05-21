import { Inject, Injectable, LoggerService } from '@nestjs/common'
import { WINSTON_MODULE_PROVIDER } from 'nest-winston'
import { Logger } from 'winston'
import { TelegramLoggerService } from './telegram-logger.service'

@Injectable()
export class AppLoggerService implements LoggerService {
    private context?: string

    constructor(
        @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
        private readonly telegramLoggerService: TelegramLoggerService,
    ) {}

    setContext(context: string): void {
        this.context = context
    }

    log(message: any, context?: string): void {
        this.logger.info(message, { context: context || this.context })
    }

    error(message: any, trace?: string, context?: string): void {
        this.logger.error(message, {
            context: context || this.context,
            trace,
        })
    }

    debug(message: any, context?: string): void {
        this.logger.debug(message, { context: context || this.context })
    }

    verbose(message: any, context?: string): void {
        this.logger.verbose(message, { context: context || this.context })
    }

    fatal(message: unknown, trace?: unknown, context?: unknown): void {
        this.logger.error(`FATAL: ${message}`, {
            context: (context as string) || this.context,
            trace: trace as string,
        })
        this.telegramLoggerService.sendFatal(
            message,
            (trace as string) || undefined,
            (context as string) || this.context,
        )
    }

    warn(message: any, context?: string, trace?: string): void {
        this.logger.warn(message, {
            context: context || this.context,
            trace,
        })
        this.telegramLoggerService.sendWarning(
            message,
            trace || undefined,
            context || this.context,
        )
    }
}
