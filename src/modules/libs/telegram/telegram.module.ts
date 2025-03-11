import { ContentModerationModule } from '@/modules/content-moderation/content-moderation.module'
import { FeedbackModule } from '@/modules/feedback/feedback.module'
import { FollowModule } from '@/modules/follow/follow.module'
import { Global, Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { TelegrafModule } from 'nestjs-telegraf'
import { TelegramService } from './telegram.service'

@Global()
@Module({
    imports: [
        TelegrafModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: (configService: ConfigService) =>
                configService.getOrThrow('telegraf'),
            inject: [ConfigService],
        }),
        FollowModule,
        FeedbackModule,
        ContentModerationModule,
    ],
    providers: [TelegramService],
    exports: [TelegramService],
})
export class TelegramModule {}
