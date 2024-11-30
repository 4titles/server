import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Title } from '../../entities/title.entity'
import { TitlesService } from './services/titles.service'
import { TitlesResolver } from './resolvers/titles.resolver'
import { CacheModule } from '../cache/cache.module'
import { IMDBModule } from '../imdb/imdb.module'
import { Name } from 'src/entities/name.entity'
import { Credit } from 'src/entities/credit.entity'
import { Country } from 'src/entities/country.entity'
import { Language } from 'src/entities/language.entity'
import { Certificate } from '../../entities/certificate.entity'
import { Poster } from 'src/entities/poster.entity'
import { CriticReview } from 'src/entities/critic-review.entity'
import { Avatar } from 'src/entities/avatar.entity'
import { Rating } from 'src/entities/rating.entity'
import { RawTitle } from 'src/entities/raw_title.entity'
import { IMDBTop100Service } from '../imdb/services/imdb-top100.service'
import { HttpModule } from '@nestjs/axios'

@Module({
    imports: [
        TypeOrmModule.forFeature([
            RawTitle,
            Title,
            Name,
            Credit,
            Country,
            Language,
            Certificate,
            Poster,
            CriticReview,
            Avatar,
            Rating,
        ]),
        HttpModule,
        IMDBModule,
        CacheModule,
    ],
    providers: [TitlesService, TitlesResolver, IMDBTop100Service],
    exports: [TitlesService],
})
export class TitlesModule {}
