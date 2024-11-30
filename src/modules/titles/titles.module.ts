import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Title } from '../../entities/title.entity'
import { TitlesService } from './services/titles.service'
import { TitlesResolver } from './resolvers/titles.resolver'
import { ImdbTop100Module } from '../imdb-top100/imdb-top100.module'
import { CacheModule } from '../cache/cache.module'

@Module({
    imports: [TypeOrmModule.forFeature([Title]), ImdbTop100Module, CacheModule],
    providers: [TitlesService, TitlesResolver],
    exports: [TitlesService],
})
export class TitlesModule {}
