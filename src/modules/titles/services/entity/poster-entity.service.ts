import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Poster } from 'src/entities/poster.entity'
import { Language } from 'src/entities/language.entity'
import { DataSource, EntityManager, In, Repository } from 'typeorm'
import { Title } from 'src/entities/title.entity'
import { IPoster } from 'src/modules/imdb/interfaces/imdb-graphql.interface'

@Injectable()
export class PosterEntityService {
    private readonly logger = new Logger(PosterEntityService.name)

    constructor(
        @InjectRepository(Poster)
        private readonly posterRepository: Repository<Poster>,
        private readonly dataSource: DataSource,
    ) {}

    async findByTitleId(titleId: number): Promise<Poster[]> {
        return await this.posterRepository.find({
            where: { title: { id: titleId } },
            relations: ['language'],
        })
    }

    async findOrCreateMany(
        title: Title,
        posters: IPoster[],
    ): Promise<Poster[]> {
        if (!posters?.length) return []

        try {
            const existingPosters = await this.findByTitleId(title.id)
            const existingPostersMap = new Map(
                existingPosters.map((poster) => [poster.url, poster]),
            )

            const languageMap = await this.getLanguagesMap(posters)
            const postersToCreate = posters.filter(
                (poster) => !existingPostersMap.has(poster.url),
            )

            if (!postersToCreate.length) {
                return Array.from(existingPostersMap.values())
            }

            const newPosters = await Promise.all(
                postersToCreate.map(async (poster) => {
                    try {
                        const posterEntity = this.posterRepository.create({
                            title,
                            language: poster.language_code
                                ? languageMap.get(poster.language_code)
                                : null,
                            url: poster.url,
                            width: poster.width,
                            height: poster.height,
                        })
                        return await this.posterRepository.save(posterEntity)
                    } catch {
                        return existingPostersMap.get(poster.url)
                    }
                }),
            )

            return [...existingPosters, ...newPosters.filter(Boolean)]
        } catch (error) {
            this.logger.error(
                `Failed to create posters for title ${title.imdbId}:`,
                error.stack,
            )
            throw error
        }
    }

    async updateMany(title: Title, posters: IPoster[]): Promise<Poster[]> {
        if (!posters?.length) return []

        try {
            const currentPosters = await this.findByTitleId(title.id)
            const updatedPosters = await this.findOrCreateMany(title, posters)
            const updatedPosterUrls = new Set(updatedPosters.map((p) => p.url))
            const postersToRemove = currentPosters.filter(
                (p) => !updatedPosterUrls.has(p.url),
            )

            if (postersToRemove.length) {
                title.posters =
                    title.posters?.filter(
                        (p) => !postersToRemove.some((rp) => rp.url === p.url),
                    ) || []
            }

            const languageMap = await this.getLanguagesMap(posters)
            const updates = updatedPosters.map((existing) => {
                const newData = posters.find((p) => p.url === existing.url)
                if (newData) {
                    existing.width = newData.width
                    existing.height = newData.height
                    existing.language = newData.language_code
                        ? languageMap.get(newData.language_code)
                        : null
                }
                return existing
            })

            return await this.posterRepository.save(updates)
        } catch (error) {
            this.logger.error(
                `Failed to update posters for title ${title.imdbId}:`,
                error.stack,
            )
            throw error
        }
    }

    private async getLanguagesMap(
        posters: IPoster[],
        entityManager: EntityManager = this.dataSource.manager,
    ): Promise<Map<string, Language>> {
        try {
            const languageCodes = [
                ...new Set(posters.map((p) => p.language_code).filter(Boolean)),
            ]

            if (!languageCodes.length) return new Map()

            const languages = await entityManager.find(Language, {
                where: { code: In(languageCodes) },
            })

            return new Map(languages.map((lang) => [lang.code, lang]))
        } catch (error) {
            this.logger.error(
                'Failed to get languages map for posters:',
                error.stack,
            )
            return new Map()
        }
    }
}
