import { Injectable, Logger } from '@nestjs/common'
import { IMDBGraphQLService } from './imdb-graphql.service'
import { TitleType } from '../../../entities/title.entity'
import { IMDBTop100Service } from './imdb-top100.service'
import { IMDBTop100Response } from '../interfaces/imdb-top100.interface'
import { IIMDbTitle } from '../interfaces/imdb-graphql.interface'

@Injectable()
export class IMDBService {
    private readonly logger = new Logger(IMDBService.name)

    constructor(
        private readonly top100Service: IMDBTop100Service,
        private readonly graphQLService: IMDBGraphQLService,
    ) {}

    async getTop100Titles(): Promise<IMDBTop100Response> {
        return this.top100Service.fetchTop100Titles()
    }

    async getTop100TitlesIds(type?: TitleType): Promise<string[]> {
        try {
            const basicTitles = await this.top100Service.fetchTop100Titles(type)
            return basicTitles.map((title) => title.imdbid)
        } catch (error) {
            this.logger.error('Failed to fetch top 100 titles IDs:', error)
            throw error
        }
    }

    async getTitleDetails(imdbId: string): Promise<IIMDbTitle> {
        try {
            return await this.graphQLService.fetchTitleById(imdbId)
        } catch (error) {
            this.logger.error(
                `Failed to fetch details for title ${imdbId}:`,
                error,
            )
            throw error
        }
    }

    async getTitlesDetails(imdbIds: string[]): Promise<IIMDbTitle[]> {
        return this.graphQLService.fetchTitlesByIds(imdbIds)
    }

    async getTop100TitlesWithDetails(type?: TitleType) {
        const ids = await this.getTop100TitlesIds(type)
        const titles = []

        for (const id of ids) {
            try {
                const details = await this.getTitleDetails(id)
                titles.push(details)
                await new Promise((resolve) => setTimeout(resolve, 100))
            } catch (error) {
                this.logger.warn(`Skipping title ${id} due to error: `, error)
                continue
            }
        }

        return titles
    }
}
