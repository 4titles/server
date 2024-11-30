import { Injectable, Logger } from '@nestjs/common'
import { HttpService } from '@nestjs/axios'
import { lastValueFrom } from 'rxjs'
import { IMDBTop100Response, ITitle } from '../interfaces/imdb-top100.interface'
import { TitleType } from 'src/entities/title.entity'
import { ConfigService } from '@nestjs/config'
import { AxiosError } from 'axios'

type FetchConfig = {
    endpoint: string
    type: TitleType
}

@Injectable()
export class IMDBTop100Service {
    constructor(
        private readonly httpService: HttpService,
        private readonly configService: ConfigService,
    ) {}

    private readonly logger = new Logger(IMDBTop100Service.name)

    private readonly fetchConfigs: FetchConfig[] = [
        {
            endpoint: this.configService.get('imdb.top100.moviesEndpoint'),
            type: TitleType.MOVIE,
        },
        {
            endpoint: this.configService.get('imdb.top100.tvSeriesEndpoint'),
            type: TitleType.TV_SERIES,
        },
    ]

    private async handleAxiosError(
        error: AxiosError,
        context: string,
    ): Promise<void> {
        if (error.response) {
            this.logger.error(`${context} - Status: ${error.response.status}`)
            this.logger.error(
                `Headers: ${JSON.stringify(error.response.headers)}`,
            )
            this.logger.error(`Data: ${JSON.stringify(error.response.data)}`)

            if (error.response.status === 429) {
                const resetTime = error.response.headers['x-ratelimit-reset']
                const remainingRequests =
                    error.response.headers['x-ratelimit-remaining']
                const limit = error.response.headers['x-ratelimit-limit']

                this.logger.error(`Rate limit info:`)
                this.logger.error(`- Remaining requests: ${remainingRequests}`)
                this.logger.error(`- Limit: ${limit}`)
                this.logger.error(
                    `- Reset time: ${new Date(Number(resetTime) * 1000)}`,
                )
            }
        } else if (error.request) {
            this.logger.error(`${context} - No response received`)
            this.logger.error(`Request: ${JSON.stringify(error.request)}`)
        } else {
            this.logger.error(
                `${context} - Error setting up request: ${error.message}`,
            )
        }

        if (error.config) {
            this.logger.error(`Request config:`)
            this.logger.error(`- Method: ${error.config.method}`)
            this.logger.error(`- URL: ${error.config.url}`)
            this.logger.error(`- Timeout: ${error.config.timeout}`)
        }
    }

    private async retryWithDelay<T>(
        operation: () => Promise<T>,
        retries = 3,
        delay = 1000,
        context: string,
    ): Promise<T> {
        try {
            return await operation()
        } catch (error) {
            if (retries > 0 && error?.response?.status === 429) {
                this.logger.warn(
                    `Rate limit exceeded. Retrying in ${delay}ms. Retries left: ${retries}`,
                )
                await new Promise((resolve) => setTimeout(resolve, delay))
                return this.retryWithDelay(
                    operation,
                    retries - 1,
                    delay * 2,
                    context,
                )
            }
            throw error
        }
    }

    private async fetchTitles(config: FetchConfig): Promise<ITitle[]> {
        return this.retryWithDelay(
            async () => {
                try {
                    this.logger.log(
                        `Fetching top-100 ${config.type} from IMDB: ${config.endpoint}`,
                    )
                    this.logger.debug(
                        `Request headers: ${JSON.stringify(
                            this.configService.get('imdb.top100.headers'),
                        )}`,
                    )

                    const { data } = await lastValueFrom(
                        this.httpService.get<IMDBTop100Response>(
                            config.endpoint,
                            {
                                headers: this.configService.get(
                                    'imdb.top100.headers',
                                ),
                            },
                        ),
                    )

                    this.logger.log(
                        `Successfully fetched ${data.length} ${config.type}s`,
                    )
                    return data.map((title) => ({
                        ...title,
                        type: config.type,
                    }))
                } catch (error) {
                    await this.handleAxiosError(
                        error as AxiosError,
                        `Failed to fetch top-100 ${config.type}`,
                    )
                    throw error
                }
            },
            3,
            1000,
            config.type,
        )
    }

    async fetchTop100Movies(): Promise<ITitle[]> {
        return this.fetchTitles(this.fetchConfigs[0])
    }

    async fetchTop100TVSeries(): Promise<ITitle[]> {
        return this.fetchTitles(this.fetchConfigs[1])
    }

    async fetchTop100Titles(type?: TitleType): Promise<ITitle[]> {
        try {
            switch (type) {
                case TitleType.MOVIE:
                    return await this.fetchTop100Movies()
                case TitleType.TV_SERIES:
                    return await this.fetchTop100TVSeries()
                default: {
                    const movies = await this.fetchTop100Movies()
                    await new Promise((resolve) => setTimeout(resolve, 1000))
                    const tvSeries = await this.fetchTop100TVSeries()
                    return [...movies, ...tvSeries]
                }
            }
        } catch (error) {
            this.logger.error('Failed to fetch titles:', error)
            throw error
        }
    }
}
