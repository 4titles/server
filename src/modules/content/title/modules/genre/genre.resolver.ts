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

    @RbacProtected({
        resource: Resource.GENRE,
        action: Action.READ,
        possession: 'any',
    })
    @Query(() => Genre, { name: 'findGenreById' })
    async findById(@Args('id') id: string): Promise<Genre> {
        return await this.genreService.findById(id)
    }

    @RbacProtected({
        resource: Resource.GENRE,
        action: Action.READ,
        possession: 'any',
    })
    @Query(() => Genre, { name: 'findGenreById' })
    async findByTmdbId(@Args('tmdbId') tmdbId: string): Promise<Genre> {
        return await this.genreService.findByTmdbId(tmdbId)
    }

    @RbacProtected({
        resource: Resource.GENRE,
        action: Action.READ,
        possession: 'any',
    })
    @Query(() => Genre, { name: 'findAllGenres' })
    async findAll(): Promise<Genre[]> {
        return await this.genreService.findAll()
    }

    @RbacProtected({
        resource: Resource.GENRE,
        action: Action.READ,
        possession: 'any',
    })
    @Query(() => [Genre], { name: 'findAllGenresWithRelations' })
    async findAllWithRelations() {
        return await this.genreService.findAllWithRelations()
    }

    @RbacProtected({
        resource: Resource.TMDB,
        action: Action.READ,
        possession: 'any',
    })
    @Query(() => [GenresByLanguage], { name: 'getGenresListFromTmdb' })
    async getListFromTmdb(): Promise<GenresByLanguage> {
        return await this.genreService.getGenresListFromTmdb()
    }

    @RbacProtected({
        resource: Resource.GENRE,
        action: Action.CREATE,
        possession: 'any',
    })
    @Mutation(() => Boolean, { name: 'createGenre' })
    async create(@Args('data') input: CreateGenreInput): Promise<boolean> {
        return await this.genreService.create(input)
    }
}
