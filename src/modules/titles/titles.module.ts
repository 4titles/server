import { forwardRef, Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { HttpModule } from '@nestjs/axios'

import { IMDBModule } from '../imdb/imdb.module'
import { CacheModule } from '../cache/cache.module'

import * as Entities from 'src/entities'

import { TitlesService } from './services/titles.service'
import { RawTitleProcessorService } from './services/processors/raw-title-processor.service'
import { TitlesResolver } from './resolvers/titles.resolver'

import * as EntityServices from './services/entity'

import * as RelationProcessors from './services/processors/relations'

@Module({
    imports: [
        TypeOrmModule.forFeature(Object.values(Entities)),
        HttpModule,
        IMDBModule,
        CacheModule,
        forwardRef(() => TitlesModule),
    ],
    providers: [
        // Core Services
        TitlesService,
        RawTitleProcessorService,
        TitlesResolver,

        // Entity Services
        ...Object.values(EntityServices),

        // Relation Processors
        ...Object.values(RelationProcessors),
    ],
    exports: [TitlesService],
})
export class TitlesModule {}
