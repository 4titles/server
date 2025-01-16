import { Module } from '@nestjs/common'
import { TelegramService } from './telegram.service'
import { TelegrafModule } from 'nestjs-telegraf'
import { ConfigModule, ConfigService } from '@nestjs/config'

@Module({
    imports: [
        TelegrafModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: (configService: ConfigService) =>
                configService.getOrThrow('telegraf'),
            inject: [ConfigService],
        }),
    ],
    providers: [TelegramService],
})
export class TelegramModule {}
