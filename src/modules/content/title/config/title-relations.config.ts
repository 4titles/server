import { Injectable } from '@nestjs/common'

export interface TitleRelationsConfig {
    genres?: {
        with?: {
            genre?: boolean
        }
    }
    countries?: {
        with?: {
            country?: boolean
        }
    }
    languages?: {
        with?: {
            language?: boolean
        }
    }
    filmingLocations?: {
        with?: {
            filmingLocation?: boolean
        }
    }
    translations?: boolean
    images?: boolean
}

@Injectable()
export class TitleRelationsConfigService {
    public readonly NONE: TitleRelationsConfig = {}

    public readonly CORE: TitleRelationsConfig = {
        genres: {
            with: {
                genre: true,
            },
        },
        countries: {
            with: {
                country: true,
            },
        },
        languages: {
            with: {
                language: true,
            },
        },
    }

    public readonly SEARCH_PREVIEW: TitleRelationsConfig = {
        translations: true,
    }

    public readonly FULL: TitleRelationsConfig = {
        genres: {
            with: {
                genre: true,
            },
        },
        countries: {
            with: {
                country: true,
            },
        },
        languages: {
            with: {
                language: true,
            },
        },
        filmingLocations: {
            with: {
                filmingLocation: true,
            },
        },
        translations: true,
        images: true,
    }

    public readonly FILMING_LOCATIONS_ONLY: TitleRelationsConfig = {
        filmingLocations: {
            with: {
                filmingLocation: true,
            },
        },
    }

    getRelationsConfig(configName: string): TitleRelationsConfig {
        const config = this[configName]
        if (!config) {
            return this.NONE
        }
        return config
    }

    createCustomRelationsConfig(
        baseConfig: TitleRelationsConfig,
        customConfig: Partial<TitleRelationsConfig>,
    ): TitleRelationsConfig {
        return {
            ...baseConfig,
            ...customConfig,
        }
    }
}
