import {
    Injectable,
    HttpException,
    HttpStatus,
    OnModuleInit,
} from '@nestjs/common'
import { HttpService } from '@nestjs/axios'
import { ConfigService } from '@nestjs/config'
import { Redis } from 'ioredis'
import { lastValueFrom } from 'rxjs'
import { Place } from './places.model'
import {
    GEOAPIFY_CULTURAL_CATEGORIES,
    GEOAPIFY_FILTERS,
    GEOAPIFY_API_BASE_URL,
    GEOAPIFY_BIAS,
    GEOAPIFY_QUERY_LIMIT,
    GEOAPIFY_CONDITIONS,
} from 'src/constants/geoapify'

@Injectable()
export class PlacesService implements OnModuleInit {
    private redis: Redis

    constructor(
        private readonly httpService: HttpService,
        private readonly configService: ConfigService,
    ) {}

    async onModuleInit() {
        this.redis = new Redis({
            host: this.configService.get('REDIS_HOST'),
            port: this.configService.get('REDIS_PORT'),
            retryStrategy(times) {
                const delay = Math.min(times * 50, 2000)
                console.log(`Retrying Redis connection in ${delay}ms...`)
                return delay
            },
            maxRetriesPerRequest: 5,
        })

        this.redis.on('error', (err) => {
            console.error('Redis connection error:', err)
        })

        this.redis.on('connect', () => {
            console.log('Successfully connected to Redis', this.redis.options)
        })
    }

    private async waitForRedis(): Promise<void> {
        if (this.redis.status === 'ready') {
            return
        }

        return new Promise((resolve) => {
            this.redis.once('ready', resolve)
        })
    }

    async getPlaces(): Promise<Place[]> {
        try {
            await this.waitForRedis()

            const cachedData = await this.redis.get(
                'sevastopol_cultural_places',
            )

            if (cachedData) {
                return JSON.parse(cachedData)
            }

            const { data } = await lastValueFrom(
                this.httpService.get(GEOAPIFY_API_BASE_URL, {
                    params: {
                        categories: `${GEOAPIFY_CULTURAL_CATEGORIES.ENTERTAINMENT_CULTURE},
                            ${GEOAPIFY_CULTURAL_CATEGORIES.ENTERTAINMENT_PLANETARIUM},
                            ${GEOAPIFY_CULTURAL_CATEGORIES.ETNERTAINMENT_MUSEUM},
                            ${GEOAPIFY_CULTURAL_CATEGORIES.ENTERTAINMENT_CINEMA}
                            `,
                        conditions: GEOAPIFY_CONDITIONS,
                        filter: GEOAPIFY_FILTERS.SEVASTOPOL_ISOLINE,
                        bias: GEOAPIFY_BIAS.SEVASTOPOL_PROXIMITY,
                        limit: GEOAPIFY_QUERY_LIMIT,
                        apiKey: this.configService.get('GEOAPIFY_KEY'),
                    },
                }),
            )

            const places = data.features.map((feature: any) => ({
                id: feature.properties.place_id,
                name: feature.properties.name,
                country: feature.properties.country,
                city: feature.properties.city,
                latitude: feature.geometry.coordinates[1],
                longitude: feature.geometry.coordinates[0],
                categories: feature.properties.categories || [],
                address: feature.properties.formatted,
            }))

            await this.redis.set(
                'sevastopol_cultural_places',
                JSON.stringify(places),
                'EX',
                3600 * 24, // 1 day
            )

            return places
        } catch (error) {
            console.error('Error occured in getPlaces:', error)
            throw new HttpException(
                'Failed to fetch cultural places',
                HttpStatus.INTERNAL_SERVER_ERROR,
            )
        }
    }
}
