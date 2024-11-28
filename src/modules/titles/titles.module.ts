import { HttpModule } from '@nestjs/axios'
import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Title } from './entities/title.entity'
import { TitlesService } from './services/titles.service'
import { IMDBTop100Service } from '../imdb-top100/services/imdb-top100.service'
import { TitlesResolver } from './resolvers/titles.resolver'
import { CacheService } from '../places/services/cache.service'
import { ConfigModule, ConfigService } from '@nestjs/config'

@Module({
    imports: [
        TypeOrmModule.forFeature([Title]),
        HttpModule.registerAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
                timeout: configService.get('imdb-top100.timeout'),
                maxRedirects: 5,
            }),
            inject: [ConfigService],
        }),
    ],
    providers: [TitlesService, TitlesResolver, IMDBTop100Service, CacheService],
    exports: [TitlesService],
})
export class TitlesModule {}
