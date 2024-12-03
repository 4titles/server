import { Module } from '@nestjs/common'
import { TitlesService } from './services/titles.service'
import { TitleEntityService } from './services/title-entity.service'
import { TitlesResolver } from './titles.resolver'
import { DrizzleModule } from 'src/drizzle/drizzle.module'
import { TmdbModule } from 'src/tmdb/tmdb.module'
import { CacheModule } from 'src/cache/cache.module'

@Module({
    imports: [CacheModule, TmdbModule, DrizzleModule],
    providers: [TitlesService, TitleEntityService, TitlesResolver],
    exports: [TitlesService],
})
export class TitlesModule {}
