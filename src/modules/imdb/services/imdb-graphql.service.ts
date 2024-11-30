import { INameDetails } from './../interfaces/imdb-graphql.interface'
import { HttpService } from '@nestjs/axios'
import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import {
    IGraphQLVariables,
    IIMDbGraphQLResponse,
    IIMDbTitle,
} from '../interfaces/imdb-graphql.interface'
import { lastValueFrom } from 'rxjs'
import { getTitleByIdQuery } from '../graphql/queries/title.query'
import { AxiosError } from 'axios'
import { getTitlesByIdsQuery } from '../graphql/queries/titles.query'
import { getNameByIdQuery } from '../graphql/queries/name.query'
import { getNamesByIdsQuery } from '../graphql/queries/names.query'

@Injectable()
export class IMDBGraphQLService {
    private readonly logger = new Logger(IMDBGraphQLService.name)
    private readonly apiUrl: string
    private readonly BATCH_SIZE = 10

    constructor(
        private readonly configService: ConfigService,
        private readonly httpService: HttpService,
    ) {
        this.apiUrl = this.configService.get('imdb.graphql.endpoint')
    }

    async fetchTitleById(imdbId: string): Promise<IIMDbTitle> {
        this.logger.debug(`Fetching title by ID: ${imdbId}`)
        const response = await this.executeGraphQLQuery<IIMDbGraphQLResponse>(
            getTitleByIdQuery,
            { id: imdbId },
        )
        return response.title
    }

    async fetchTitlesByIds(imdbIds: string[]): Promise<IIMDbTitle[]> {
        this.logger.debug(`Fetching titles by IDs: ${imdbIds.join(', ')}`)
        const batches = this.createBatches(imdbIds)
        const results = await Promise.all(
            batches.map((batch) =>
                this.executeGraphQLQuery<{ titles: IIMDbTitle[] }>(
                    getTitlesByIdsQuery,
                    {
                        ids: batch,
                    },
                ),
            ),
        )
        return results.flatMap((result) => result.titles)
    }

    async fetchNameById(nameId: string): Promise<INameDetails> {
        this.logger.debug(`Fetching name by ID: ${nameId}`)
        const response = await this.executeGraphQLQuery<{
            name: INameDetails
        }>(getNameByIdQuery, { id: nameId })
        return response.name
    }

    async fetchNamesByIds(nameIds: string[]): Promise<INameDetails[]> {
        this.logger.debug('Fetching names by IDs')
        const batches = this.createBatches(nameIds)
        const results = await Promise.all(
            batches.map((batch) =>
                this.executeGraphQLQuery<{ names: INameDetails[] }>(
                    getNamesByIdsQuery,
                    { ids: batch },
                ),
            ),
        )
        return results.flatMap((result) => result.names)
    }

    private createBatches<T>(items: T[]): T[][] {
        const batches: T[][] = []
        for (let i = 0; i < items.length; i += this.BATCH_SIZE) {
            batches.push(items.slice(i, i + this.BATCH_SIZE))
        }
        return batches
    }

    private async executeGraphQLQuery<T>(
        query: string,
        variables?: IGraphQLVariables,
    ): Promise<T> {
        try {
            const { data } = await lastValueFrom(
                this.httpService.post<{ data: T }>(this.apiUrl, {
                    query,
                    variables,
                }),
            )

            return data.data
        } catch (error) {
            this.handleGraphQLError(error as AxiosError, query, variables)
            throw error
        }
    }

    private handleGraphQLError(
        error: AxiosError,
        query: string,
        variables?: IGraphQLVariables,
    ): void {
        const context = `GraphQL query failed`
        this.logger.error(`${context}:`)
        this.logger.error(`Query: ${query}`)
        this.logger.error(`Variables: ${JSON.stringify(variables)}`)

        if (error.response) {
            this.logger.error(`Status: ${error.response.status}`)
            this.logger.error(
                `Response: ${JSON.stringify(error.response.data)}`,
            )
        } else if (error.request) {
            this.logger.error('No response received')
        } else {
            this.logger.error(`Error: ${error.message}`)
        }
    }
}
