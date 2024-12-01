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
import { Name } from 'src/entities/name.entity'

@Injectable()
export class CreditEntityService {
    private readonly logger = new Logger(CreditEntityService.name)

    constructor(
        @InjectRepository(Credit)
        private readonly creditRepository: Repository<Credit>,
        private readonly nameEntityService: NameEntityService,
    ) {}

    async findByTitleIdAndNameId(
        titleId: number,
        nameId: number,
        category: string,
    ): Promise<Credit | null> {
        return this.creditRepository.findOne({
            where: {
                title: { id: titleId },
                name: { id: nameId },
                category,
            },
        })
    }

    async findByTitleIdAndCategory(
        titleId: number,
        category: string,
    ): Promise<Credit[]> {
        return this.creditRepository.find({
            where: {
                title: { id: titleId },
                category,
            },
            relations: ['name', 'name.avatars'],
        })
    }

    async createMany(title: Title, titleData: IIMDbTitle): Promise<Credit[]> {
        try {
            const mappedCredits = this.mapAllCredits(titleData)
            if (!mappedCredits.length) return []

            const processedCredits = await this.processCredits(
                title,
                mappedCredits,
            )
            return processedCredits.filter(Boolean)
        } catch (error) {
            this.logger.error(
                `Failed to create credits for title ${title.imdbId}:`,
                error.stack,
            )
            return []
        }
    }

    async updateMany(title: Title, titleData: IIMDbTitle): Promise<void> {
        try {
            const mappedCredits = this.mapAllCredits(titleData)
            if (!mappedCredits.length) return

            await this.processCredits(title, mappedCredits)
        } catch (error) {
            this.logger.error(
                `Failed to update credits for title ${title.imdbId}:`,
                error.stack,
            )
        }
    }

    private mapAllCredits(
        titleData: IIMDbTitle,
    ): Array<ICredit & { category: string }> {
        const creditMappings = [
            { credits: titleData.directors, category: CreditCategory.DIRECTOR },
            { credits: titleData.writers, category: CreditCategory.WRITER },
            { credits: titleData.casts, category: CreditCategory.ACTOR },
        ]

        return creditMappings.reduce((acc, { credits, category }) => {
            if (!credits?.length) return acc

            const mapped = credits.map((credit) => ({
                ...credit,
                category,
            }))

            return [...acc, ...mapped]
        }, [])
    }

    private async processCredits(
        title: Title,
        credits: Array<ICredit & { category: string }>,
    ): Promise<Credit[]> {
        try {
            const creditsByCategory = this.groupByCategory(credits)

            const processedCredits = await Promise.all(
                Object.entries(creditsByCategory).map(
                    ([category, categoryCredits]) =>
                        this.processCategoryCredits(
                            title,
                            category,
                            categoryCredits,
                        ),
                ),
            )

            return processedCredits.flat()
        } catch (error) {
            this.logger.error(
                `Failed to process credits for title ${title.imdbId}:`,
                error.stack,
            )
            return []
        }
    }

    private async processCategoryCredits(
        title: Title,
        category: string,
        credits: ICredit[],
    ): Promise<Credit[]> {
        try {
            const existingCredits = await this.findByTitleIdAndCategory(
                title.id,
                category,
            )
            const existingCreditsMap = new Map(
                existingCredits.map((credit) => [
                    `${credit.name.id}-${credit.category}`,
                    credit,
                ]),
            )

            const processPromises = credits.map(async (creditData) => {
                const name = await this.nameEntityService.findOrCreate(
                    creditData.name,
                )
                const key = `${name.id}-${category}`
                const existing = existingCreditsMap.get(key)

                if (existing) {
                    return this.updateCredit(existing, creditData)
                }

                return this.createCredit(title, name, {
                    ...creditData,
                    category,
                })
            })

            return Promise.all(processPromises)
        } catch (error) {
            this.logger.error(
                `Failed to process ${category} credits for title ${title.imdbId}`,
                error.stack,
            )
            return []
        }
    }

    private groupByCategory(
        credits: Array<ICredit & { category: string }>,
    ): Record<string, ICredit[]> {
        return credits.reduce((acc, credit) => {
            const category = credit.category
            if (!acc[category]) acc[category] = []
            acc[category].push(credit)
            return acc
        }, {})
    }

    private async createCredit(
        title: Title,
        name: Name,
        creditData: ICredit & { category: string },
    ): Promise<Credit> {
        try {
            const credit = this.creditRepository.create({
                title,
                name,
                category: creditData.category,
                characters: creditData.characters,
                episodesCount: creditData.episodes_count,
            })

            return this.creditRepository.save(credit)
        } catch (error) {
            this.logger.error(
                `Failed to create credit for title ${title.imdbId}:`,
                error.stack,
            )
            throw error
        }
    }

    private async updateCredit(
        existing: Credit,
        creditData: ICredit,
    ): Promise<Credit> {
        return this.creditRepository.save({
            ...existing,
            characters: creditData.characters,
            episodesCount: creditData.episodes_count,
        })
    }
}
