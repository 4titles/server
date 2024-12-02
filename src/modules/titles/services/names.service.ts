import { Injectable, Logger } from '@nestjs/common'
import { NameEntityService } from './entity'
import { Name } from 'src/entities'
import { CacheService } from '../../cache/cache.service'
import { CACHE_CONFIG, getCacheKey } from '../config/cache.config'

@Injectable()
export class NamesService {
    private readonly logger = new Logger(NamesService.name)
    constructor(
        private readonly nameEntityService: NameEntityService,
        private readonly cacheService: CacheService,
    ) {}

    async getById(id: number): Promise<Name | null> {
        return this.nameEntityService.findById(id)
    }

    async getByImdbId(imdbId: string): Promise<Name | null> {
        try {
            const cacheKey = getCacheKey.forName(imdbId)
            const cachedName = await this.cacheService.get<Name>(cacheKey)

            if (cachedName) {
                this.logger.debug(`Cache hit for name ${imdbId}`)
                return cachedName
            }

            const name = await this.nameEntityService.findByImdbId(imdbId)

            if (!name) {
                this.logger.warn(`Name with IMDb ID ${imdbId} not found`)
                return null
            }

            await this.cacheService.set(cacheKey, name, CACHE_CONFIG.NAMES.TTL)

            return name
        } catch (error) {
            this.logger.error(`Failed to get name by IMDb ID ${imdbId}:`, error)
            return null
        }
    }

    async getByImdbIds(imdbIds: string[]): Promise<Name[]> {
        if (!imdbIds.length) {
            return []
        }

        try {
            const cachedNames = await Promise.all(
                imdbIds.map((id) => this.getByImdbId(id)),
            )
            const foundNames = cachedNames.filter(Boolean) as Name[]

            if (foundNames.length === imdbIds.length) {
                return foundNames
            }

            const names = await this.nameEntityService.findByImdbIds(imdbIds)

            await Promise.all(
                names.map((name) =>
                    this.cacheService.set(
                        getCacheKey.forTitle(name.imdbId),
                        name,
                        CACHE_CONFIG.NAMES.TTL,
                    ),
                ),
            )
        } catch (error) {
            this.logger.error(
                `Failed to get names by IMDb IDs ${imdbIds}:`,
                error,
            )
            return []
        }
    }

    async getNames(
        skip: number = 0,
        take: number = 50,
    ): Promise<{ items: Name[]; totalCount: number }> {
        try {
            const cacheKey = getCacheKey.forNamesList(skip, take)
            const cachedResult = await this.cacheService.get<{
                items: Name[]
                totalCount: number
            }>(cacheKey)

            if (cachedResult) {
                this.logger.debug(
                    `Cache hit for names list skip=${skip} take=${take}`,
                )
                return cachedResult
            }

            const [items, totalCount] = await Promise.all([
                this.nameEntityService.findAll(skip, take, [
                    'avatars',
                    'credits',
                    'knownFor',
                ]),
                this.nameEntityService.count(),
            ])

            const result = { items, totalCount }

            await this.cacheService.set(
                cacheKey,
                result,
                CACHE_CONFIG.NAMES.TTL,
            )

            return result
        } catch (error) {
            this.logger.error(
                `Failed to get names list skip=${skip} take=${take}:`,
                error,
            )
            return { items: [], totalCount: 0 }
        }
    }
}
