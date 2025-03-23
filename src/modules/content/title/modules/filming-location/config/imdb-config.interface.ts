import type { Browser } from 'puppeteer'

export interface IBrowserPoolEntry {
    browser: Browser
    available: boolean
    pages: number
    lastUsed: number
    errors: number
}

export interface IBrowserSettings {
    readonly pool: {
        readonly minSize: number
        readonly maxSize: number
        readonly concurrentPages: number
        readonly retrieveAttempts: number
    }
    readonly viewport: {
        readonly width: number
        readonly height: number
    }
    readonly args: string[]
    readonly userAgent: string
}

export interface ITimingSettings {
    readonly timeout: {
        readonly browser: number
        readonly page: number
        readonly element: number
        readonly browserWait: number
        readonly error: string
    }
    readonly delay: {
        readonly requests: number
        readonly chunks: number
    }
}

export interface IProcessingSettings {
    readonly chunkSize: number
    readonly maxRetries: number
    readonly minLocationParts: number
}

export interface ISelectors {
    readonly locations: {
        readonly section: string
        readonly card: string
        readonly link: string
        readonly description: string
        readonly noContentSection: string
        readonly expandButtons: {
            more: string
            all: string
        }
    }
}

export interface IImdbConfig {
    readonly baseUrl: string
    readonly browser: IBrowserSettings
    readonly timing: ITimingSettings
    readonly processing: IProcessingSettings
    readonly selectors: ISelectors
    readonly noLocationsMessagePattern: string
}
