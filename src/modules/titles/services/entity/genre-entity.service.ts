import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Title } from 'src/entities'
import { Genre } from 'src/entities/genre.entity'
import { In, Repository } from 'typeorm'

@Injectable()
export class GenreEntityService {
    private readonly logger = new Logger(GenreEntityService.name)
    constructor(
        @InjectRepository(Genre)
        private readonly genreRepository: Repository<Genre>,
    ) {}

    async findByNameAndTitleImdbId(
        name: string,
        titleImdbId: string,
    ): Promise<Genre | null> {
        return this.genreRepository.findOne({
            where: { name, titles: { imdbId: titleImdbId } },
        })
    }

    async findByNamesAndTitleImdbIds(
        names: string[],
        titleImdbIds: string[],
    ): Promise<Genre[]> {
        if (!names?.length) return []
        this.logger.log(JSON.stringify(names))

        return this.genreRepository.find({
            where: { name: In(names), titles: { imdbId: In(titleImdbIds) } },
        })
    }

    async findByTitleId(titleId: number): Promise<Genre[]> {
        return await this.genreRepository.find({
            where: { titles: { id: titleId } },
            relations: ['titles'],
        })
    }

    private async findByName(name: string): Promise<Genre | null> {
        if (!name) return null
        const trimmedName = name.trim()

        return this.genreRepository.findOne({
            where: { name: trimmedName },
        })
    }

    private async findByNames(names: string[]): Promise<Genre[]> {
        if (!names?.length) return []

        const validNames = names.map((name) => name?.trim()).filter(Boolean)

        if (!validNames.length) return []

        return this.genreRepository.find({
            where: validNames.map((name) => ({ name })),
        })
    }

    async findOrCreateMany(title: Title, genres: string[]): Promise<Genre[]> {
        if (!genres?.length) return []

        try {
            const existingGenres = await this.findByNames(genres)
            const existingGenreNames = new Set(
                existingGenres.map((g) => g.name),
            )

            const newGenreNames = genres
                .map((name) => name?.trim())
                .filter((name) => name && !existingGenreNames.has(name))

            const newGenres = await Promise.all(
                newGenreNames.map((name) =>
                    this.create({ name }).catch(() => {
                        return this.findByName(name)
                    }),
                ),
            )

            return [...existingGenres, ...newGenres.filter(Boolean)]
        } catch (error) {
            this.logger.error(
                `Failed to create genres for title ${title.imdbId}:`,
                error.stack,
            )
            throw error
        }
    }

    async updateMany(title: Title, genres: string[]): Promise<Genre[]> {
        if (!genres?.length) return []

        try {
            const currentGenres = await this.findByTitleId(title.id)
            const updatedGenres = await this.findOrCreateMany(title, genres)
            const updatedGenreIds = new Set(updatedGenres.map((g) => g.id))
            const genresToRemove = currentGenres.filter(
                (g) => !updatedGenreIds.has(g.id),
            )

            if (genresToRemove.length) {
                title.genres =
                    title.genres?.filter(
                        (g) => !genresToRemove.some((rg) => rg.id === g.id),
                    ) || []
            }

            return updatedGenres
        } catch (error) {
            this.logger.error(
                `Failed to update genres for title ${title.imdbId}:`,
                error.stack,
            )
            throw error
        }
    }

    private async create(data: { name: string }): Promise<Genre> {
        try {
            const genre = this.genreRepository.create({
                name: data.name.trim(),
            })
            return await this.genreRepository.save(genre)
        } catch {
            return this.findByName(data.name) as Promise<Genre>
        }
    }
}
