import { Module } from '@nestjs/common'
import { TitlesService } from './services/titles.service'
import { TitleEntityService } from './services/title-entity.service'
import { TitlesResolver } from './resolvers/titles.resolver'
import { DrizzleModule } from 'src/drizzle/drizzle.module'
import { TmdbModule } from 'src/tmdb/tmdb.module'
import { CacheModule } from 'src/cache/cache.module'
import { MovieService } from './services/movie.service'
import { TvShowService } from './services/tv-show.service'
import { MoviesResolver } from './resolvers/movies.resolver'
import { TvShowsResolver } from './resolvers/tv-shows.resolver'
import { LocationsModule } from 'src/locations/locations.module'

@Module({
    imports: [CacheModule, TmdbModule, DrizzleModule, LocationsModule],
    providers: [
        TitlesService,
        TitleEntityService,
        MovieService,
        TvShowService,
        MoviesResolver,
        TvShowsResolver,
        TitlesResolver,
    ],
    exports: [TitlesService],
})
export class TitlesModule {}
