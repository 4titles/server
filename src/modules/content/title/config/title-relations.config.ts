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
            filmingLocation?: {
                with?: {
                    descriptions?: {
                        with?: {
                            language?: boolean
                        }
                    }
                    user?: boolean
                }
            }
        }
    }
    translations?: {
        with?: {
            language?: boolean
        }
    }
    images?: {
        with?: {
            language?: boolean
        }
    }
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
        translations: {
            with: {
                language: true,
            },
        },
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
                filmingLocation: {
                    with: {
                        descriptions: {
                            with: {
                                language: true,
                            },
                        },
                        user: true,
                    },
                },
            },
        },
        translations: {
            with: {
                language: true,
            },
        },
        images: {
            with: {
                language: true,
            },
        },
    }

    public readonly FILMING_LOCATIONS_ONLY: TitleRelationsConfig = {
        filmingLocations: {
            with: {
                filmingLocation: {
                    with: {
                        descriptions: {
                            with: {
                                language: true,
                            },
                        },
                    },
                },
            },
        },
    }

    public readonly BASIC_DETAILS_WITH_TRANSLATIONS: TitleRelationsConfig = {
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
        translations: {
            with: {
                language: true,
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
