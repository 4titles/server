import { Action } from '@/modules/auth/rbac/enums/actions.enum'
import { Resource } from '@/modules/auth/rbac/enums/resources.enum'
import { RbacProtected } from '@/shared/guards/rbac-protected.guard'
import { Args, Query, Resolver } from '@nestjs/graphql'
import { Genre } from '../models/genre.model'
import { GenreService } from '../services/genre.service'

@Resolver(() => Genre)
export class GenresResolver {
    constructor(private readonly genreService: GenreService) {}

    @RbacProtected({
        resource: Resource.GENRE,
        action: Action.READ,
        possession: 'any',
    })
    @Query(() => [Genre], {
        description: 'Get all available genres',
    })
    async genres(): Promise<Genre[]> {
        return await this.genreService.getAllGenres()
    }

    @RbacProtected({
        resource: Resource.GENRE,
        action: Action.READ,
        possession: 'any',
    })
    @Query(() => [Genre], {
        description: 'Get genres for a specific title by IMDB ID',
    })
    async genresForTitle(
        @Args('imdbId') imdbId: string,
        @Args('isMovie', { nullable: true }) isMovie?: boolean,
    ): Promise<Genre[]> {
        return await this.genreService.getGenresForTitle(imdbId, isMovie)
    }

    @RbacProtected({
        resource: Resource.GENRE,
        action: Action.READ,
        possession: 'any',
    })
    @Query(() => Genre, {
        nullable: true,
        description: 'Get a specific genre by TMDB ID',
    })
    async genreByTmdbId(@Args('tmdbId') tmdbId: string): Promise<Genre | null> {
        return await this.genreService.getGenreByTmdbId(tmdbId)
    }
}
