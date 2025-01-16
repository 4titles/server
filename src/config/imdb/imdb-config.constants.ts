export const BROWSER_SETTINGS = {
    POOL: {
        MIN_SIZE: 1,
        MAX_SIZE: 8,
        CONCURRENT_PAGES: 6,
        RETRIEVE_ATTEMPTS: 5,
    },
    VIEWPORT: {
        WIDTH: 1920,
        HEIGHT: 1080,
    },
    ARGS: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
    ] as const,
    USER_AGENT:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
} as const

export const TIMING_SETTINGS = {
    TIMEOUT: {
        BROWSER: 20_000,
        PAGE: 12_000,
        ELEMENT: 9_000,
        BROWSER_WAIT: 7_000,
        TIMEOUT_ERROR: 'TimeoutError',
    },
    DELAY: {
        REQUESTS: 1_500,
        CHUNKS: 3_000,
    },
} as const

export const PROCESSING_SETTINGS = {
    CHUNK_SIZE: 10,
    MAX_RETRIES: 2,
    MIN_LOCATION_PARTS: 2,
} as const

export const IMDB_SELECTORS = {
    LOCATIONS: {
        SECTION: '[data-testid="sub-section-flmg_locations"]',
        CARD: '.ipc-list-card',
        LINK: '.ipc-link',
        DESCRIPTION: '[data-testid="item-attributes"]',
        NO_CONTENT_SECTION: '.ipc-page-section--base',
        EXPAND_BUTTON: 'button.ipc-see-more__button',
    },
} as const
