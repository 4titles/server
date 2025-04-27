import { HttpService } from '@nestjs/axios'
import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { catchError, firstValueFrom, map, of } from 'rxjs'
import { FlagOptions } from './types/flag-options.interface'

@Injectable()
export class CountryFlagService {
    private readonly logger: Logger = new Logger(CountryFlagService.name)
    private readonly countryFlagApiBaseUrl: string
    private readonly defaultFlagStyle: string
    private readonly defaultFlagSize: number

    constructor(
        private readonly httpService: HttpService,
        private readonly configService: ConfigService,
    ) {
        this.countryFlagApiBaseUrl = this.configService.get<string>(
            'COUNTRY_FLAG_API_BASE_URL',
            'https://flagsapi.com',
        )
        this.defaultFlagStyle = this.configService.get<string>(
            'COUNTRY_FLAG_STYLE',
            'flat',
        )
        this.defaultFlagSize = this.configService.get<number>(
            'COUNTRY_FLAG_SIZE',
            64,
        )
    }

    async getFlagUrl(
        iso: string,
        options?: FlagOptions,
    ): Promise<string | null> {
        if (!iso || iso.length !== 2) {
            this.logger.warn(`Invalid ISO code: ${iso}`)
            return null
        }

        const isoUpper = iso.toUpperCase()

        const style = options?.style || this.defaultFlagStyle
        const size = options?.size || this.defaultFlagSize

        const flagUrl = `${this.countryFlagApiBaseUrl}/${isoUpper}/${style}/${size}.png`

        try {
            const isAvailable = await firstValueFrom(
                this.httpService.head(flagUrl).pipe(
                    map(() => true),
                    catchError((error) => {
                        this.logger.warn(
                            `Flag not found for ISO ${iso}: ${error.message}`,
                        )
                        return of(false)
                    }),
                ),
            )

            return isAvailable ? flagUrl : null
        } catch (error) {
            this.logger.error(
                `Error fetching flag for ISO ${iso}: ${error.message}`,
            )
            return null
        }
    }

    async getFlagUrlsForCountries(
        isoCodes: string[],
        options?: FlagOptions,
    ): Promise<Record<string, string | null>> {
        const result: Record<string, string | null> = {}

        const flagPromises = isoCodes.map(async (iso) => {
            result[iso] = await this.getFlagUrl(iso, options)
        })

        await Promise.all(flagPromises)
        return result
    }
}
