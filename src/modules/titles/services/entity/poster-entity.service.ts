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

    async findByTitleIdAndUrls(
        titleId: number,
        urls: string[],
    ): Promise<Poster[]> {
        return this.posterRepository.find({
            where: { title: { id: titleId }, url: In(urls) },
            relations: ['language'],
        })
    }

    async createMany(title: Title, posters: IPoster[]): Promise<Poster[]> {
        if (!posters?.length) return []

        try {
            const existingPosters =
                (await this.findByTitleIdAndUrls(
                    title.id,
                    posters.map((poster) => poster.url),
                )) || []

            const existingPostersMap =
                new Map(
                    existingPosters.map((poster) => [poster.url, poster]),
                ) || []

            const languageMap = await this.getLanguagesMap(posters)

            const posterPromises = posters.map(async (poster) => {
                const existing =
                    existingPostersMap instanceof Map
                        ? existingPostersMap.get(poster.url)
                        : null

                if (existing) {
                    return existing
                }

                const posterEntity = this.posterRepository.create({
                    title,
                    language: poster.language_code
                        ? languageMap.get(poster.language_code)
                        : null,
                    url: poster.url,
                    width: poster.width,
                    height: poster.height,
                })

                return this.posterRepository.save(posterEntity)
            })

            const results = await Promise.all(posterPromises)
            return results.filter(Boolean)
        } catch (error) {
            this.logger.error(
                `Failed to create posters for title ${title.imdbId}:`,
                error.stack,
            )
            return []
        }
    }

    async updateMany(title: Title, posters: IPoster[] = []): Promise<void> {
        if (!posters?.length) return

        try {
            const existingPosters =
                (await this.findByTitleIdAndUrls(
                    title.id,
                    posters.map((poster) => poster.url),
                )) || []

            const languageMap = await this.getLanguagesMap(posters)

            const updatePromises = existingPosters.map(async (existing) => {
                const newData = posters.find(
                    (poster) => poster.url === existing.url,
                )
                if (newData) {
                    existing.width = newData.width
                    existing.height = newData.height
                    existing.language = newData.language_code
                        ? languageMap.get(newData.language_code)
                        : null
                    return this.posterRepository.save(existing)
                }
            })

            const postersToCreate = posters.filter(
                (poster) =>
                    !existingPosters.some(
                        (existing) => existing.url === poster.url,
                    ),
            )

            await Promise.all(
                [
                    ...updatePromises,
                    postersToCreate.length &&
                        this.createMany(title, postersToCreate),
                ].filter(Boolean),
            )
        } catch (error) {
            this.logger.error(
                `Failed to update posters for title ${title.imdbId}:`,
                error.stack,
            )
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
                `Failed to get languages map for posters:`,
                error.stack,
            )
            return new Map()
        }
    }
}
