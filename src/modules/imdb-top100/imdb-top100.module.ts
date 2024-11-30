import { HttpModule } from '@nestjs/axios'
import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { IMDBTop100Service } from './services/imdb-top100.service'

@Module({
    imports: [
        HttpModule.registerAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
                timeout: configService.get('imdb-top100.timeout'),
                maxRedirects: 5,
            }),
            inject: [ConfigService],
        }),
    ],
    providers: [IMDBTop100Service],
    exports: [IMDBTop100Service],
})
export class ImdbTop100Module {}
