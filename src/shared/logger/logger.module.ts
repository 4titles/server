import { Global, Module } from '@nestjs/common'
import { AppLoggerService } from './app-logger.service'
import { TelegramLoggerService } from './telegram-logger.service'

@Global()
@Module({
    providers: [AppLoggerService, TelegramLoggerService],
    exports: [AppLoggerService],
})
export class LoggerModule {}
