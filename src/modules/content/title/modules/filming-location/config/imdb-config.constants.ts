export const BROWSER_SETTINGS = {
    POOL: {
        MIN_SIZE: 1,
        MAX_SIZE: 8,
        CONCURRENT_PAGES: 4,
        RETRIEVE_ATTEMPTS: 7,
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
        '--disable-features=site-per-process',
    ],
    USER_AGENT:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
}

export const TIMING_SETTINGS = {
    TIMEOUT: {
        BROWSER: 40_000,
        PAGE: 22_000,
        ELEMENT: 15_000,
        BROWSER_WAIT: 10_000,
        TIMEOUT_ERROR: 'TimeoutError',
    },
    DELAY: {
        REQUESTS: 3_000,
        CHUNKS: 5_000,
    },
}

export const PROCESSING_SETTINGS = {
    CHUNK_SIZE: 8,
    MAX_RETRIES: 3,
    MIN_LOCATION_PARTS: 1,
}

export const IMDB_SELECTORS = {
    LOCATIONS: {
        SECTION: '[data-testid="sub-section-flmg_locations"]',
        CARD: '.ipc-list-card',
        LINK: '.ipc-link',
        DESCRIPTION: '[data-testid="item-attributes"]',
        NO_CONTENT_SECTION: '.ipc-page-section--base',
        EXPAND_BUTTONS: {
            MORE: 'span.single-page-see-more-button-flmg_locations button.ipc-see-more__button',
            ALL: 'span.chained-see-more-button-flmg_locations button.ipc-see-more__button',
        },
    },
}
