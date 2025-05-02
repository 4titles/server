import { AiRateLimiterService } from '@/modules/infrastructure/ai/ai-rate-limiter.service'
import { AiService } from '@/modules/infrastructure/ai/ai.service'
import {
    getLocationDescriptionPrompt,
    LocationDescriptionPromptParams,
} from '@/modules/infrastructure/ai/prompts/location-description.prompt'
import { delay as sleep } from '@/shared/utils/time/delay.utils'
import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { RateLimitExceededException } from '../../../../infrastructure/ai/exceptions/rate-limit-exceeded-exception'
import { TitleRelationsConfigService } from '../../config/title-relations.config'
import { TitleSupportedLanguagesConfig } from '../../config/title-supported-languages.config'
import { TitleSupportedLanguage } from '../../enums/title-supported-languages.enum'
import { Title } from '../../models/title.model'
import { LocationDescriptionDto } from '../../modules/filming-location/dto/location-description.dto'
import { FilmingLocationDescriptionService } from '../../modules/filming-location/services/filming-location-description.service'
import { FilmingLocationService } from '../../modules/filming-location/services/filming-location.service'
import { TitleService } from '../title.service'
import { TitleElasticsearchLocationSyncService } from './title-elasticsearch-location-sync.service'

@Injectable()
export class TitleLocationDescriptionSyncService {
    private readonly logger = new Logger(
        TitleLocationDescriptionSyncService.name,
    )
    private readonly MAX_RATE_ERRORS = this.configService.get<number>(
        'MAX_RATE_LIMIT_ERRORS',
        3,
    )

    constructor(
        private readonly titleService: TitleService,
        private readonly filmingLocationService: FilmingLocationService,
        private readonly filmingLocationDescriptionService: FilmingLocationDescriptionService,
        private readonly titleEsLocationSyncService: TitleElasticsearchLocationSyncService,
        private readonly titleRelationsConfig: TitleRelationsConfigService,
        private readonly languagesConfig: TitleSupportedLanguagesConfig,
        private readonly aiService: AiService,
        private readonly aiRateLimiterService: AiRateLimiterService,
        private readonly configService: ConfigService,
    ) {}

    async enhanceLocationDescription(
        titleId: string,
        locationId: string,
        language?: string,
    ): Promise<boolean> {
        const title = await this.titleService.findById(titleId, {
            customRelations:
                this.titleRelationsConfig.BASIC_DETAILS_WITH_TRANSLATIONS,
        })
        if (!title) {
            this.logger.warn(`Title with id ${titleId} not found`)
            return false
        }

        const location = await this.filmingLocationService.findById(locationId)
        if (!location) {
            this.logger.warn(`Location with id ${locationId} not found`)
            return false
        }

        const supportedLangs = this.languagesConfig
            .getFullSupportLanguages()
            .map((l) => l.iso)
        const languagesToProcess = language ? [language] : supportedLangs
        const translations = (title as Title)?.translations || []
        const en = translations.find(
            (t) => t.language.iso === TitleSupportedLanguage.EN,
        )
        if (!en?.overview) {
            this.logger.debug(
                `Missing English overview for title ${titleId}, skip ...`,
            )
            return false
        }

        const baseLocationDescriptionDto = this.buildBaseLocationDescriptionDto(
            title,
            location,
            en.overview,
        )

        let successCount = 0
        let rateErrors = 0

        for (const lang of languagesToProcess) {
            if (rateErrors >= this.MAX_RATE_ERRORS) break

            const overview =
                translations.find((t) => t.language.iso === lang)?.overview ||
                translations[0]?.overview ||
                ''
            const dto = new LocationDescriptionDto({
                ...baseLocationDescriptionDto,
                titlePlot: overview,
                language: lang,
            })

            try {
                const description = await this.generateWithRetries(dto)
                if (!description) continue

                const saved =
                    await this.filmingLocationDescriptionService.createDescription(
                        locationId,
                        lang,
                        description,
                    )
                if (saved) successCount++
            } catch (err) {
                if (err instanceof RateLimitExceededException) {
                    rateErrors++
                    this.aiRateLimiterService.notifyRateLimitExceeded(
                        'deepseek',
                    )
                    const delay = Math.pow(2, rateErrors) * 1000
                    await sleep(delay)
                } else {
                    this.logger.error(
                        `Error for ${lang}: ${err.message}`,
                        err.stack,
                    )
                }
            }
        }

        if (successCount > 0) await this.syncToElasticsearch(titleId)
        return successCount > 0
    }

    private buildBaseLocationDescriptionDto(title, location, overview: string) {
        const year = new Date(title.releaseDate).getFullYear().toString()
        return {
            titleId: title.id,
            locationId: location.id,
            titleName: title.originalName,
            titleType: title.type,
            titleYear: year,
            titleGenres: (title.genres || []).map((g) => g.genre.name),
            titlePlot: overview,
            locationAddress: location.address,
            locationCity: location.city || '',
            locationState: location.state || '',
            locationCountry: location.country?.name || '',
        }
    }

    private async generateWithRetries(
        params: LocationDescriptionDto,
    ): Promise<string | null> {
        const maxRetries = this.configService.get<number>('MAX_LLM_RETRIES', 3)
        let attempt = 0
        while (attempt <= maxRetries) {
            try {
                const promptParams: LocationDescriptionPromptParams = {
                    ...params,
                }
                const prompt = getLocationDescriptionPrompt(promptParams)
                const resp = await this.aiService.completion(prompt, {
                    language: params.language,
                })
                if (!resp.trim()) throw new Error('EMPTY_RESPONSE')
                return resp
            } catch (e) {
                attempt++
                if (e instanceof RateLimitExceededException) throw e
                if (attempt > maxRetries) {
                    this.logger.error(
                        `Failed after ${maxRetries} retries: ${e.message}`,
                    )
                    return null
                }
                const delay = Math.min(1000 * Math.pow(2, attempt), 10000)
                await sleep(delay)
            }
        }
        return null
    }

    private async syncToElasticsearch(titleId: string) {
        const title = await this.titleService.findById(titleId, {
            customRelations: this.titleRelationsConfig.FILMING_LOCATIONS_ONLY,
        })
        if (title) {
            await this.titleEsLocationSyncService.updateTitleFilmingLocations(
                titleId,
                (title as any).filmingLocations,
            )
        }
    }
}
