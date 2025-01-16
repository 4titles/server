import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Ctx, Start, Update } from 'nestjs-telegraf'
import { Context, Telegraf } from 'telegraf'

@Update()
@Injectable()
export class TelegramService extends Telegraf {
    private readonly logger: Logger = new Logger(TelegramService.name)
    private readonly _token: string

    constructor(private readonly configService: ConfigService) {
        super(configService.getOrThrow<string>('telegraf.token'))
        this._token = configService.getOrThrow<string>('telegraf.token')
    }

    @Start()
    async onStart(@Ctx() ctx: Context) {
        const username = ctx.message.from.username
        await ctx.replyWithHTML(`Hello, ${username}!`)
    }
}
