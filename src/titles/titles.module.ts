import { forwardRef, Module } from '@nestjs/common'
import { TitlesService } from './services/titles.service'
import { TitlesResolver } from './resolvers/titles.resolver'
import { DrizzleModule } from 'src/drizzle/drizzle.module'
import { TmdbModule } from 'src/tmdb/tmdb.module'
import { CacheModule } from 'src/cache/cache.module'
import { MovieService } from './services/movie.service'
import { TvShowService } from './services/tv-show.service'
import { MoviesResolver } from './resolvers/movies.resolver'
import { TvShowsResolver } from './resolvers/tv-shows.resolver'
import { LocationsModule } from 'src/locations/locations.module'
import { TitleEntityService } from './services/entity/title-entity.service'
import { TvShowEntityService } from './services/entity/tv-show-entity.service'
import { MovieEntityService } from './services/entity/movie-entity.service'

@Module({
    imports: [
        CacheModule,
        TmdbModule,
        DrizzleModule,
        forwardRef(() => LocationsModule),
    ],
    providers: [
        TitlesService,
        MovieService,
        TvShowService,
        MoviesResolver,
        TvShowsResolver,
        TitlesResolver,
        TitleEntityService,
        MovieEntityService,
        TvShowEntityService,
    ],
    exports: [
        TitlesService,
        TitleEntityService,
        MovieEntityService,
        TvShowEntityService,
    ],
})
export class TitlesModule {}
