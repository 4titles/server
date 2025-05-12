import { Action } from '@/modules/auth/rbac/enums/actions.enum'
import { Resource } from '@/modules/auth/rbac/enums/resources.enum'
import { RbacProtected } from '@/shared/guards/rbac-protected.guard'
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql'
import { GenreService } from './genre.service'
import { CreateGenreInput } from './inputs/create-genre.input'
import { Genre } from './models/genre.model'
import { GenresByLanguage } from './models/genres-by-language.model'

@Resolver(() => Genre)
export class GenreResolver {
    constructor(private readonly genreService: GenreService) {}

    @Query(() => Genre)
    async findGenreById(@Args('id') id: string): Promise<Genre> {
        return await this.genreService.findById(id)
    }

    @Query(() => Genre)
    async findGenreByTmdbId(@Args('tmdbId') tmdbId: string): Promise<Genre> {
        return await this.genreService.findByTmdbId(tmdbId)
    }

    @Query(() => [Genre])
    async findAllGenres(): Promise<Genre[]> {
        return await this.genreService.findAll()
    }

    @Query(() => [Genre])
    async findAllGenresWithRelations() {
        return await this.genreService.findAllWithRelations()
    }

    @RbacProtected({
        resource: Resource.TMDB,
        action: Action.READ,
        possession: 'any',
    })
    @Query(() => [GenresByLanguage])
    async getGenresListFromTmdb(): Promise<GenresByLanguage> {
        return await this.genreService.getGenresListFromTmdb()
    }

    @RbacProtected({
        resource: Resource.GENRE,
        action: Action.CREATE,
        possession: 'any',
    })
    @Mutation(() => Boolean)
    async createGenre(@Args('data') input: CreateGenreInput): Promise<boolean> {
        return await this.genreService.create(input)
    }
}
