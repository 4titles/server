import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Credit, CreditCategory } from 'src/entities/credit.entity'
import { Title } from 'src/entities/title.entity'
import {
    ICredit,
    IIMDbTitle,
} from 'src/modules/imdb/interfaces/imdb-graphql.interface'
import { Repository } from 'typeorm'
import { NameEntityService } from './name-entity.service'

@Injectable()
export class CreditEntityService {
    private readonly logger = new Logger(CreditEntityService.name)

    constructor(
        @InjectRepository(Credit)
        private readonly creditRepository: Repository<Credit>,
        private readonly nameEntityService: NameEntityService,
    ) {}

    async createMany(title: Title, titleData: IIMDbTitle): Promise<Credit[]> {
        const allCredits = [
            ...this.mapCredits(titleData.directors, 'director'),
            ...this.mapCredits(titleData.writers, 'writer'),
            ...this.mapCredits(titleData.casts, this.determineCastCategory),
        ]

        const creditEntities = await Promise.all(
            allCredits.map(async (creditData) => {
                const name = await this.nameEntityService.findOrCreate(
                    creditData.name,
                )

                const exists = await this.creditRepository.findOne({
                    where: {
                        title: { id: title.id },
                        name: { id: name.id },
                        category: creditData.category,
                    },
                })

                if (exists) {
                    this.logger.debug(
                        `Credit for name ${name.imdbId} and category ${creditData.category} already exists for title ${title.id}`,
                    )
                    return exists
                }

                const credit = this.creditRepository.create({
                    title,
                    name,
                    category: creditData.category,
                    characters: creditData.characters,
                    episodesCount: creditData.episodes_count,
                })

                return this.creditRepository.save(credit)
            }),
        )

        return creditEntities.filter(Boolean)
    }

    async updateMany(title: Title, titleData: IIMDbTitle): Promise<void> {
        const existingCredits = await this.creditRepository.find({
            where: { title: { id: title.id } },
            relations: ['name'],
        })

        const allNewCredits = [
            ...this.mapCredits(titleData.directors, 'director'),
            ...this.mapCredits(titleData.writers, 'writer'),
            ...this.mapCredits(titleData.casts, this.determineCastCategory),
        ]

        const creditsToDelete = existingCredits.filter(
            (existing) =>
                !allNewCredits.some(
                    (credit) =>
                        credit.name.id === existing.name.imdbId &&
                        credit.category === existing.category,
                ),
        )

        await Promise.all([
            creditsToDelete.length &&
                this.creditRepository.remove(creditsToDelete),
            this.createMany(title, titleData),
        ])
    }

    private mapCredits(
        credits: ICredit[],
        category: string | ((credit: ICredit) => string),
    ): Array<ICredit & { category: string }> {
        return credits.map((credit) => ({
            ...credit,
            category:
                typeof category === 'function' ? category(credit) : category,
        }))
    }

    //@todo
    private determineCastCategory(credit: ICredit): string {
        return CreditCategory.ACTOR
    }

    async deleteByTitleId(titleId: number): Promise<void> {
        await this.creditRepository.delete({ title: { id: titleId } })
    }
}
