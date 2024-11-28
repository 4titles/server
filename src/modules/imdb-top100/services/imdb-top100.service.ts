import { Injectable, Logger } from '@nestjs/common'
import { HttpService } from '@nestjs/axios'
import { lastValueFrom } from 'rxjs'
import { IMDBTop100Response, ITitle } from '../interfaces/imdb-top100.response'
import { TitleType } from 'src/modules/titles/entities/title.entity'
import { ConfigService } from '@nestjs/config'

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
            endpoint: this.configService.get('imdb-top100.topMoviesEndPoint'),
            type: TitleType.MOVIE,
        },
        {
            endpoint: this.configService.get('imdb-top100.topTvSeriesEndPoint'),
            type: TitleType.TV_SERIES,
        },
    ]

    private async fetchTitles(config: FetchConfig): Promise<ITitle[]> {
        try {
            const { data } = await lastValueFrom(
                this.httpService.get<IMDBTop100Response>(config.endpoint, {
                    headers: this.configService.get('imdb-top100.headers'),
                }),
            )

            return data.map((title) => ({
                ...title,
                type: config.type,
            }))
        } catch (err) {
            this.logger.error(
                `Failed to fetch top-100 ${config.type} from IMDB: ${err}`,
            )
            throw err
        }
    }

    async fetchTop100Movies(): Promise<ITitle[]> {
        return this.fetchTitles(this.fetchConfigs[0])
    }

    async fetchTop100TVSeries(): Promise<ITitle[]> {
        return this.fetchTitles(this.fetchConfigs[1])
    }

    async fetchTop100Titles(): Promise<ITitle[]> {
        const fetchPromises = this.fetchConfigs.map((config) =>
            this.fetchTitles(config),
        )

        const results = await Promise.all(fetchPromises)
        return results.flat()
    }
}
