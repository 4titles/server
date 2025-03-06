import { AccountModule } from '@/modules/auth/account/account.module'
import { FollowModule } from '@/modules/follow/follow.module'
import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { TelegrafModule } from 'nestjs-telegraf'
import { TelegramService } from './telegram.service'

@Module({
    imports: [
        TelegrafModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: (configService: ConfigService) =>
                configService.getOrThrow('telegraf'),
            inject: [ConfigService],
        }),
        AccountModule,
        FollowModule,
    ],
    providers: [TelegramService],
})
export class TelegramModule {}
