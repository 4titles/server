import getTelegrafConfig from '@/config/telegraf.config'
import { FeedbackModule } from '@/modules/content/feedback/feedback.module'
import { FollowModule } from '@/modules/content/follow/follow.module'
import { Global, Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { TelegrafModule } from 'nestjs-telegraf'
import { TelegramUserContextService } from './telegram-user-context.service'
import { TelegramService } from './telegram.service'

@Global()
@Module({
    imports: [
        TelegrafModule.forRootAsync({
            useFactory: getTelegrafConfig,
            inject: [ConfigService],
        }),
        FollowModule,
        FeedbackModule,
    ],
    providers: [TelegramService, TelegramUserContextService],
    exports: [TelegramService],
})
export class TelegramModule {}
