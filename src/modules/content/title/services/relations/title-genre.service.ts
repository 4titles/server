import { DRIZZLE } from '@/modules/infrastructure/drizzle/drizzle.module'
import { titleGenres } from '@/modules/infrastructure/drizzle/schema/title-genres.schema'
import { DrizzleDB } from '@/modules/infrastructure/drizzle/types/drizzle'
import { Inject, Injectable } from '@nestjs/common'
import { GenreService } from '../../modules/genre/genre.service'
import { TmdbGenre } from '../../modules/tmdb/models/tmdb-genre.model'

@Injectable()
export class TitleGenreService {
    constructor(
        @Inject(DRIZZLE) private readonly db: DrizzleDB,
        private readonly genreService: GenreService,
    ) {}

    async linkTitleToGenres(
        tx: DrizzleDB,
        titleId: string,
        genres: TmdbGenre[],
    ): Promise<void> {
        if (!genres?.length) return

        const genreIds = await this.genreService.getIdsByTmdbIds(
            genres.map((g) => g.id.toString()),
        )

        const relations = genreIds.map((genreId) => ({
            titleId,
            genreId,
        }))

        if (relations.length) {
            await tx.insert(titleGenres).values(relations)
        }
    }
}
