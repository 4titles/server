import { Module } from '@nestjs/common'
import { TmdbModule } from '../tmdb/tmdb.module'
import { GenreResolver } from './genre.resolver'
import { GenreService } from './genre.service'

@Module({
    imports: [TmdbModule],
    providers: [GenreService, GenreResolver],
    exports: [GenreService],
})
export class GenreModule {}
