import { HttpModule } from '@nestjs/axios'
import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { IMDBTop100Service } from './services/imdb-top100.service'
import { IMDBService } from './services/imdb.service'
import { IMDBGraphQLService } from './services/imdb-graphql.service'

@Module({
    imports: [
        HttpModule.registerAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
                timeout: configService.get('imdb.timeout'),
                maxRedirects: 5,
            }),
            inject: [ConfigService],
        }),
    ],
    providers: [IMDBService, IMDBTop100Service, IMDBGraphQLService],
    exports: [IMDBService],
})
export class IMDBModule {}
