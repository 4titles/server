import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Poster } from 'src/entities/poster.entity'
import { Language } from 'src/entities/language.entity'
import { Repository } from 'typeorm'
import { Title } from 'src/entities/title.entity'
import { IPoster } from 'src/modules/imdb/interfaces/imdb-graphql.interface'

@Injectable()
export class PosterEntityService {
    private readonly logger = new Logger(PosterEntityService.name)

    constructor(
        @InjectRepository(Poster)
        private readonly posterRepository: Repository<Poster>,
        @InjectRepository(Language)
        private readonly languageRepository: Repository<Language>,
    ) {}

    async createMany(title: Title, posters: IPoster[]): Promise<Poster[]> {
        const posterEntities = await Promise.all(
            posters.map(async (poster) => {
                const exists = await this.posterRepository.findOne({
                    where: { title: { id: title.id }, url: poster.url },
                })

                if (exists) {
                    this.logger.debug(
                        `Poster ${poster.url} already exists for title ${title.id}`,
                    )
                    return exists
                }

                const language = poster.language_code
                    ? await this.languageRepository.findOne({
                          where: { code: poster.language_code },
                      })
                    : null

                const posterEntity = this.posterRepository.create({
                    title,
                    language,
                    url: poster.url,
                    width: poster.width,
                    height: poster.height,
                })

                return this.posterRepository.save(posterEntity)
            }),
        )

        return posterEntities.filter(Boolean)
    }

    async updateMany(title: Title, posters: IPoster[]): Promise<void> {
        this.logger.debug(`Updating posters for title ${title.id}`)
        const existingPosters = await this.posterRepository.find({
            where: { title: { id: title.id } },
        })

        const postersToDelete = existingPosters.filter(
            (existing) =>
                !posters.some((poster) => poster.url === existing.url),
        )

        const postersToCreate = posters.filter(
            (poster) =>
                !existingPosters.some(
                    (existing) => existing.url === poster.url,
                ),
        )

        await Promise.all([
            postersToDelete.length &&
                this.posterRepository.remove(postersToDelete),
            postersToCreate.length && this.createMany(title, postersToCreate),
        ])
    }

    async deleteByTitleId(titleId: number): Promise<void> {
        await this.posterRepository.delete({ title: { id: titleId } })
    }
}
