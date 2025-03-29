import { ConfigService } from '@nestjs/config'
import type { TelegrafModuleOptions } from 'nestjs-telegraf'

export default function getTelegrafConfig(
    configService: ConfigService,
): TelegrafModuleOptions {
    return {
        token: configService.getOrThrow<string>('TELEGRAM_BOT_TOKEN'),
    }
}
