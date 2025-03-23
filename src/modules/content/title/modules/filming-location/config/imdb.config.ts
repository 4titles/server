import {
    BROWSER_SETTINGS,
    IMDB_SELECTORS,
    PROCESSING_SETTINGS,
    TIMING_SETTINGS,
} from './imdb-config.constants'
import { IImdbConfig } from './imdb-config.interface'

export function getImdbConfig(): IImdbConfig {
    return {
        baseUrl: 'https://www.imdb.com/title',
        browser: {
            pool: {
                minSize: BROWSER_SETTINGS.POOL.MIN_SIZE,
                maxSize: BROWSER_SETTINGS.POOL.MAX_SIZE,
                concurrentPages: BROWSER_SETTINGS.POOL.CONCURRENT_PAGES,
                retrieveAttempts: BROWSER_SETTINGS.POOL.RETRIEVE_ATTEMPTS,
            },
            viewport: {
                width: BROWSER_SETTINGS.VIEWPORT.WIDTH,
                height: BROWSER_SETTINGS.VIEWPORT.HEIGHT,
            },
            args: BROWSER_SETTINGS.ARGS,
            userAgent: BROWSER_SETTINGS.USER_AGENT,
        },
        timing: {
            timeout: {
                browser: TIMING_SETTINGS.TIMEOUT.BROWSER,
                page: TIMING_SETTINGS.TIMEOUT.PAGE,
                element: TIMING_SETTINGS.TIMEOUT.ELEMENT,
                browserWait: TIMING_SETTINGS.TIMEOUT.BROWSER_WAIT,
                error: TIMING_SETTINGS.TIMEOUT.TIMEOUT_ERROR,
            },
            delay: {
                requests: TIMING_SETTINGS.DELAY.REQUESTS,
                chunks: TIMING_SETTINGS.DELAY.CHUNKS,
            },
        },
        processing: {
            chunkSize: PROCESSING_SETTINGS.CHUNK_SIZE,
            maxRetries: PROCESSING_SETTINGS.MAX_RETRIES,
            minLocationParts: PROCESSING_SETTINGS.MIN_LOCATION_PARTS,
        },
        selectors: {
            locations: {
                section: IMDB_SELECTORS.LOCATIONS.SECTION,
                card: IMDB_SELECTORS.LOCATIONS.CARD,
                link: IMDB_SELECTORS.LOCATIONS.LINK,
                description: IMDB_SELECTORS.LOCATIONS.DESCRIPTION,
                noContentSection: IMDB_SELECTORS.LOCATIONS.NO_CONTENT_SECTION,
                expandButtons: {
                    more: IMDB_SELECTORS.LOCATIONS.EXPAND_BUTTONS.MORE,
                    all: IMDB_SELECTORS.LOCATIONS.EXPAND_BUTTONS.ALL,
                },
            },
        },
        noLocationsMessagePattern: "It looks like we don't have any",
    }
}
