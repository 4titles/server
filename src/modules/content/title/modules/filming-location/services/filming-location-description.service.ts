import { AiService } from '@/modules/infrastructure/ai/ai.service'
import {
    getLocationDescriptionPrompt,
    LocationDescriptionPromptParams,
} from '@/modules/infrastructure/ai/prompts/location-description.prompt'
import { Injectable, Logger } from '@nestjs/common'
import { LocationDescriptionDto } from '../dto/location-description.dto'

@Injectable()
export class FilmingLocationDescriptionService {
    private readonly logger = new Logger(FilmingLocationDescriptionService.name)

    constructor(private readonly aiService: AiService) {}

    async generateLocationDescription(
        params: LocationDescriptionDto,
    ): Promise<string | null> {
        try {
            const promptParams: LocationDescriptionPromptParams = {
                titleName: params.titleName,
                titleType: params.titleType,
                titleYear: params.titleYear,
                titleGenres: params.titleGenres,
                titlePlot: params.titlePlot,
                locationAddress: params.locationAddress,
                locationCity: params.locationCity,
                locationState: params.locationState,
                locationCountry: params.locationCountry,
                language: params.language,
            }

            const prompt = getLocationDescriptionPrompt(promptParams)

            this.logger.debug(
                `Generating description for location ${params.locationId} of title ${params.titleId}`,
            )

            const description = await this.aiService.completion(prompt, {
                language: params.language,
            })

            return description
        } catch (error) {
            this.logger.error(
                `Failed to generate description for location ${params.locationId} of title ${params.titleId}`,
                error.stack,
            )
            return null
        }
    }
}
