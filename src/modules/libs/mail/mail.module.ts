import getMailerConfig from '@/config/mailer.config'
import { MailerModule } from '@nestjs-modules/mailer'
import { Global, Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { MailService } from './mail.service'

@Global()
@Module({
    imports: [
        MailerModule.forRootAsync({
            useFactory: getMailerConfig,
            inject: [ConfigService],
        }),
    ],
    providers: [MailService],
    exports: [MailService],
})
export class MailModule {}
