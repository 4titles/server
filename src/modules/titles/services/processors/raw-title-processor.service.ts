import { Injectable, Logger } from '@nestjs/common'
import { RawTitle } from 'src/entities/raw_title.entity'
import { Title } from 'src/entities/title.entity'
import { IMDBGraphQLService } from 'src/modules/imdb/services/imdb-graphql.service'
import { TitleEntityService } from '../entity/title-entity.service'
import { IIMDbTitle } from 'src/modules/imdb/interfaces/imdb-graphql.interface'

@Injectable()
export class RawTitleProcessorService {
    private readonly logger = new Logger(RawTitleProcessorService.name)

    constructor(
        private readonly imdbGraphQLService: IMDBGraphQLService,
        private readonly titleEntityService: TitleEntityService,
    ) {}

    async processRawTitles(rawTitles: RawTitle[]): Promise<Title[]> {
        try {
            this.logger.log(
                `Starting to process ${rawTitles.length} raw titles`,
            )

            const imdbIds = rawTitles.map((title) => title.imdbId)

            const titleDetails =
                await this.imdbGraphQLService.fetchTitlesByIds(imdbIds)

            if (!titleDetails.length) {
                this.logger.warn(
                    'No titles fetched from GraphQL API. Using fallback.',
                )
                return this.processTitlesFromRawData(rawTitles)
            }

            this.logger.log(
                `Successfully fetched ${titleDetails.length} titles from GraphQL API`,
            )

            const processedTitles = await Promise.all(
                titleDetails.map(async (details) => {
                    try {
                        return await this.processTitle(details)
                    } catch (error) {
                        this.logger.error(
                            `Failed to process title ${details.id}:`,
                            error,
                        )
                        return null
                    }
                }),
            )

            const validTitles = processedTitles.filter(Boolean)
            this.logger.log(
                `Successfully processed ${validTitles.length} titles`,
            )

            return validTitles
        } catch (error) {
            this.logger.error('Failed to process raw titles:', error)
            this.logger.log('Falling back to raw data processing')
            return this.processTitlesFromRawData(rawTitles)
        }
    }

    private async processTitle(
        titleDetails: IIMDbTitle,
    ): Promise<Title | null> {
        const existingTitle = await this.titleEntityService.findByImdbId(
            titleDetails.id,
        )

        try {
            if (existingTitle) {
                const updatedTitle = await this.titleEntityService.update(
                    existingTitle,
                    titleDetails,
                )
                this.logger.debug(`Updated title ${titleDetails.id}`)
                return updatedTitle
            } else {
                const newTitle =
                    await this.titleEntityService.create(titleDetails)
                this.logger.debug(`Created title ${titleDetails.id}`)
                return newTitle
            }
        } catch (error) {
            this.logger.error(
                `Failed to ${existingTitle ? 'update' : 'create'} title ${titleDetails.id}:`,
                error,
            )
            return null
        }
    }

    private async processTitlesFromRawData(
        rawTitles: RawTitle[],
    ): Promise<Title[]> {
        this.logger.log(`Processing ${rawTitles.length} titles from raw data`)
        const processedTitles: Title[] = []

        for (const rawTitle of rawTitles) {
            try {
                const existingTitle =
                    await this.titleEntityService.findByImdbId(rawTitle.imdbId)
                const titleData = this.mapRawDataToIMDbTitle(rawTitle)

                if (existingTitle) {
                    const updatedTitle = await this.titleEntityService.update(
                        existingTitle,
                        titleData,
                    )
                    processedTitles.push(updatedTitle)
                    this.logger.debug(
                        `Updated title ${rawTitle.imdbId} from raw data`,
                    )
                } else {
                    const newTitle =
                        await this.titleEntityService.create(titleData)
                    processedTitles.push(newTitle)
                    this.logger.debug(
                        `Created title ${rawTitle.imdbId} from raw data`,
                    )
                }
            } catch (error) {
                this.logger.error(
                    `Failed to process raw title ${rawTitle.imdbId} from raw data:`,
                    error,
                )
            }
        }

        this.logger.log(
            `Successfully processed ${processedTitles.length} titles from raw data`,
        )
        return processedTitles
    }

    private mapRawDataToIMDbTitle(rawTitle: RawTitle): IIMDbTitle {
        const { data } = rawTitle
        return {
            id: data.imdbid,
            type: data.type,
            is_adult: false,
            primary_title: data.title,
            original_title: null,
            start_year: parseInt(data.year),
            end_year: null,
            runtime_minutes: null,
            plot: data.description,
            genres: data.genre,
            rating: {
                aggregate_rating: data.rating,
                votes_count: 0,
            },
            posters: [
                {
                    url: data.big_image,
                    width: null,
                    height: null,
                    language_code: 'en',
                },
                {
                    url: data.image,
                    width: null,
                    height: null,
                    language_code: 'en',
                },
                {
                    url: data.thumbnail,
                    width: null,
                    height: null,
                    language_code: 'en',
                },
            ].filter((poster) => poster.url),
            certificates: [],
            spoken_languages: [],
            origin_countries: [],
            critic_review: null,
            directors: [],
            writers: [],
            casts: [],
        }
    }
}
